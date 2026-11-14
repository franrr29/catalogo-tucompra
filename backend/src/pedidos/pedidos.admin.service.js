const baseDatos = require("../config/db");
const crearError = require("../utils/crearError");

const ESTADOS = ["pendiente", "pagado", "cancelado"];
const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 50;

// convierte un parametro de la url a entero dentro de un rango; sin valor usa el por defecto
function leerEntero(valor, porDefecto, nombre, min, max) {
  if (valor === undefined || valor === "") return porDefecto;
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) {
    throw crearError(`${nombre} invalido`, 400);
  }
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero < min || numero > max) {
    throw crearError(`${nombre} invalido: debe estar entre ${min} y ${max}`, 400);
  }
  return numero;
}

// listado paginado para el panel: solo los datos necesarios para la tabla, sin cedula, direccion ni comentario
async function listarPedidosService({ estado, pagina, limite }) {
  if (estado !== undefined && estado !== "todos" && !ESTADOS.includes(estado)) {
    throw crearError("estado invalido: usa pendiente, pagado, cancelado o todos", 400);
  }
  const paginaNum = leerEntero(pagina, 1, "pagina", 1, 1000000);
  const limiteNum = leerEntero(limite, LIMITE_POR_DEFECTO, "limite", 1, LIMITE_MAXIMO);

  // el estado ya se valido contra la lista y ademas viaja como parametro, nunca dentro del texto del sql
  const filtrar = estado !== undefined && estado !== "todos";
  const where = filtrar ? "WHERE estado = ?" : "";
  const parametrosWhere = filtrar ? [estado] : [];

  const [[conteo]] = await baseDatos.query(
    `SELECT COUNT(*) AS cantidad FROM pedidos ${where}`,
    parametrosWhere
  );
  const total = Number(conteo.cantidad);

  const [filas] = await baseDatos.query(
    `SELECT id, fecha, nombre, total, estado, tipo_entrega
     FROM pedidos ${where}
     ORDER BY fecha DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...parametrosWhere, limiteNum, (paginaNum - 1) * limiteNum]
  );

  return {
    pedidos: filas.map((fila) => ({
      id: fila.id,
      fecha: fila.fecha,
      nombre: fila.nombre,
      total: Number(fila.total),
      estado: fila.estado,
      tipoEntrega: fila.tipo_entrega,
    })),
    pagina: paginaNum,
    limite: limiteNum,
    total,
    totalPaginas: Math.ceil(total / limiteNum),
  };
}

// detalle completo de un pedido: contacto, envio, items y el id de mercado pago
async function obtenerPedidoAdminService(id) {
  const idNumerico = Number(id);
  if (!/^\d+$/.test(String(id)) || !Number.isSafeInteger(idNumerico) || idNumerico <= 0) {
    throw crearError("id de pedido invalido", 400);
  }

  const [pedidos] = await baseDatos.query(
    `SELECT id, fecha, estado, total, mercadopago_id, nombre, email, telefono,
            tipo_entrega, cedula, departamento, ciudad, direccion, agencia, comentario
     FROM pedidos WHERE id = ?`,
    [idNumerico]
  );

  if (pedidos.length === 0) {
    throw crearError("pedido no encontrado", 404);
  }

  const [items] = await baseDatos.query(
    `SELECT pi.producto_id, p.nombre, pi.cantidad, pi.precio_unitario
     FROM pedido_items pi
     JOIN productos p ON p.id = pi.producto_id
     WHERE pi.pedido_id = ?
     ORDER BY pi.id`,
    [idNumerico]
  );

  const pedido = pedidos[0];

  return {
    id: pedido.id,
    fecha: pedido.fecha,
    estado: pedido.estado,
    total: Number(pedido.total),
    mercadopagoId: pedido.mercadopago_id,
    cliente: {
      nombre: pedido.nombre,
      email: pedido.email,
      telefono: pedido.telefono,
    },
    // los pedidos anteriores a la funcion de envio no tienen estos datos
    envio: pedido.tipo_entrega
      ? {
          tipoEntrega: pedido.tipo_entrega,
          cedula: pedido.cedula,
          departamento: pedido.departamento,
          ciudad: pedido.ciudad,
          direccion: pedido.direccion,
          agencia: pedido.agencia,
          comentario: pedido.comentario,
        }
      : null,
    items: items.map((item) => ({
      productoId: item.producto_id,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precioUnitario: Number(item.precio_unitario),
      subtotal: Math.round(Number(item.precio_unitario) * item.cantidad * 100) / 100,
    })),
  };
}

module.exports = { listarPedidosService, obtenerPedidoAdminService, ESTADOS };
