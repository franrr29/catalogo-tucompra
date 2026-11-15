// carga datos FALSOS en la base de desarrollo para poder probar el panel y los reportes.
// uso: npm run semillas (desde backend/)
// db.js se niega a conectar a una base que no sea local fuera de produccion; aca ademas se corta si NODE_ENV es production.
// no borra nada: solo carga si productos y pedidos estan vacios

if (process.env.NODE_ENV === "production") {
  console.error("semillas: no se ejecuta con NODE_ENV=production");
  process.exit(1);
}

const baseDatos = require("../src/config/db");

// todo inventado: nada de esto es un dato real
const PRODUCTOS = [
  // nombre, categoria, precio, costo (null = desconocido), stock, activo
  ["Auriculares Demo", "Tecnologia", 1890, 950, 25, 1],
  ["Cargador Rapido Demo", "Tecnologia", 790, 320, 40, 1],
  ["Parlante Portatil Demo", "Tecnologia", 2490, 1400, 12, 1],
  ["Mochila Urbana Demo", "Accesorios", 1590, 700, 18, 1],
  ["Billetera Demo", "Accesorios", 690, null, 30, 1],
  ["Reloj Deportivo Demo", "Accesorios", 3290, 1800, 6, 1],
  ["Botella Termica Demo", "Hogar", 890, 380, 50, 1],
  ["Lampara de Mesa Demo", "Hogar", 1290, 520, 15, 1],
  ["Set de Cuchillos Demo", "Hogar", 1790, null, 9, 1],
  ["Pelota de Futbol Demo", "Deporte", 990, 450, 0, 1],
  ["Colchoneta Yoga Demo", "Deporte", 1190, 500, 22, 1],
  ["Producto Descontinuado Demo", "Hogar", 500, 200, 3, 0],
];

const DEPARTAMENTO_Y_CIUDAD = [
  ["Montevideo", "Montevideo"],
  ["Canelones", "Ciudad de la Costa"],
  ["Maldonado", "Punta del Este"],
  ["Salto", "Salto"],
  ["Colonia", "Colonia del Sacramento"],
];

// estado, estado_envio, tipo de entrega, hace cuantos dias, [indice de producto, cantidad] ...
const PEDIDOS = [
  ["pagado", "entregado", "domicilio", 55, [[0, 1], [1, 2]]],
  ["pagado", "entregado", "agencia", 41, [[3, 1]]],
  ["pagado", "enviado", "domicilio", 12, [[2, 1], [6, 2]]],
  ["pagado", null, "domicilio", 3, [[5, 1]]],
  ["pagado", null, "agencia", 1, [[7, 1], [10, 1]]],
  ["pendiente", null, "domicilio", 0, [[4, 3]]],
  ["cancelado", null, "agencia", 20, [[8, 1]]],
  ["pagado", "entregado", "domicilio", 33, [[0, 2], [6, 1], [10, 2]]],
];

async function cargar() {
  const [[{ total: productos }]] = await baseDatos.query("SELECT COUNT(*) AS total FROM productos");
  const [[{ total: pedidos }]] = await baseDatos.query("SELECT COUNT(*) AS total FROM pedidos");
  if (productos > 0 || pedidos > 0) {
    console.log("semillas: la base ya tiene datos, no se carga nada. Para empezar de cero recrea la base de desarrollo.");
    return;
  }

  const conexion = await baseDatos.getConnection();
  try {
    await conexion.beginTransaction();

    const ids = [];
    for (const [indice, [nombre, categoria, precio, costo, stock, activo]] of PRODUCTOS.entries()) {
      const [resultado] = await conexion.query(
        "INSERT INTO productos (nombre, descripcion, categoria, precio, costo, stock, activo) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [nombre, `Descripcion de ejemplo para ${nombre}. Dato falso de desarrollo.`, categoria, precio, costo, stock, activo]
      );
      ids.push(resultado.insertId);
      await conexion.query(
        "INSERT INTO producto_imagenes (producto_id, imagen_url, orden) VALUES (?, ?, 1)",
        [resultado.insertId, `https://placehold.co/800x800?text=Demo+${indice + 1}`]
      );
    }

    for (const [n, [estado, estadoEnvio, tipoEntrega, dias, items]] of PEDIDOS.entries()) {
      const numero = n + 1;
      const [departamento, ciudad] = DEPARTAMENTO_Y_CIUDAD[n % DEPARTAMENTO_Y_CIUDAD.length];
      const total = items.reduce((suma, [indice, cantidad]) => suma + PRODUCTOS[indice][2] * cantidad, 0);

      const [resultado] = await conexion.query(
        `INSERT INTO pedidos
          (nombre, telefono, email, total, mercadopago_id, estado, fecha, tipo_entrega, departamento, ciudad,
           direccion, agencia, estado_envio, nro_seguimiento, enviado_en)
         VALUES (?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), ?, ?, ?, ?, ?, ?, ?,
                 IF(? IN ('enviado','entregado'), DATE_SUB(NOW(), INTERVAL ? DAY), NULL))`,
        [
          `Cliente Demo ${numero}`,
          `+5989900000${numero}`,
          `demo${numero}@example.com`,
          total,
          estado === "pagado" ? `DEMO-${numero}` : null,
          estado,
          dias,
          tipoEntrega,
          departamento,
          ciudad,
          tipoEntrega === "domicilio" ? `Calle Falsa ${100 + numero}` : null,
          tipoEntrega === "agencia" ? "Agencia Demo Centro" : null,
          estadoEnvio,
          estadoEnvio ? `DEMO-SEG-${numero}` : null,
          estadoEnvio,
          Math.max(dias - 1, 0),
        ]
      );

      for (const [indice, cantidad] of items) {
        await conexion.query(
          "INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, costo_unitario) VALUES (?, ?, ?, ?, ?)",
          [resultado.insertId, ids[indice], cantidad, PRODUCTOS[indice][2], PRODUCTOS[indice][3]]
        );
      }
    }

    await conexion.commit();
    console.log(`semillas: ${PRODUCTOS.length} productos y ${PEDIDOS.length} pedidos de ejemplo cargados`);
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

cargar()
  .catch((error) => {
    console.error("semillas: error:", error.code || error.name, error.message);
    process.exitCode = 1;
  })
  .finally(() => baseDatos.end());
