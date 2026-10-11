const baseDatos = require("../config/db");
const { Preference } = require("mercadopago");
const mp = require("../config/mercadoPago.js");
const crearError = require("../utils/crearError");

async function crearPedidoService(nombre, email, telefono, items) {
  // valido que las cantidades sean numeros enteros positivos antes de usarlas
  for (const item of items) {
    if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
      throw crearError("La cantidad debe ser un numero entero mayor a 0", 400);
    }
  }

  // saco los ids de los items para consultar solo esos productos
  const itemIds = items.map((item) => item.productoId);
  const placeholders = itemIds.map(() => "?").join(", ");

  const [productos] = await baseDatos.query(
    `SELECT * FROM productos WHERE activo = 1 AND id IN (${placeholders})`,
    itemIds
  );

  // verifico que todos los productos existan
  if (productos.length !== items.length) {
    throw crearError("Algunos productos no existen", 400);
  }

  // verifico stock suficiente para cada item
  for (const item of items) {
    const producto = productos.find((p) => p.id === item.productoId);
    if (producto.stock < item.cantidad) {
      throw crearError(`Stock insuficiente para ${producto.nombre}`, 400);
    }
  }

  // calculo el total con precios reales de la BD
  const totalPedido = items.reduce((total, item) => {
    const producto = productos.find((p) => p.id === item.productoId);
    return total + producto.precio * item.cantidad;
  }, 0);

  // abro una conexion individual para manejar la transaccion
  const conexion = await baseDatos.getConnection();

  try {
    await conexion.beginTransaction();

    // inserto el pedido
    const [result] = await conexion.query(
      "INSERT INTO pedidos (nombre, email, telefono, total) VALUES (?, ?, ?, ?)",
      [nombre, email, telefono, totalPedido]
    );

    const pedidoId = result.insertId;

    // inserto los items del pedido
    await conexion.query(
      "INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario) VALUES ?",
      [
        items.map((item) => {
          const producto = productos.find((p) => p.id === item.productoId);
          return [pedidoId, item.productoId, item.cantidad, producto.precio];
        }),
      ]
    );

    // descuento stock de cada producto, la condicion stock >= ? evita que quede negativo si dos compras se cruzan
    for (const item of items) {
      const [actualizacion] = await conexion.query(
        "UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?",
        [item.cantidad, item.productoId, item.cantidad]
      );

      if (actualizacion.affectedRows === 0) {
        throw crearError("Stock insuficiente", 400);
      }
    }

    // creo la preferencia antes del commit para poder hacer rollback si falla
    const preference = {
      items: items.map((item) => {
        const producto = productos.find((p) => p.id === item.productoId);
        return {
          title: producto.nombre,
          quantity: item.cantidad,
          unit_price: Number(producto.precio),
        };
      }),
      external_reference: String(pedidoId),
     back_urls: {
     success: process.env.FRONTEND_URL + "/pago-exitoso",
     failure: process.env.FRONTEND_URL + "/pago-fallido",
     pending: process.env.FRONTEND_URL + "/pago-pendiente",
    },
    };

    // auto_return solo funciona con back_urls publicas, no localhost
    if (process.env.FRONTEND_URL?.startsWith("https://")) {
      preference.auto_return = "approved";
    }

    // le mando la preferencia a mercadopago y me devuelve la url de pago
    const resultado = await new Preference(mp).create({ body: preference });

    await conexion.commit();

    return {
      id: pedidoId,
      total: totalPedido,
      init_point: resultado.init_point,
    };
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

module.exports = { crearPedidoService };
