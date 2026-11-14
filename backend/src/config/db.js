require("dotenv").config();

const mysql = require("mysql2/promise");

const baseDatos = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

async function testConexion() {
  try {
    const connection = await baseDatos.getConnection();

    console.log("Conectado a la base de datos");

    connection.release();

  } catch (error) {
    console.log("Error al conectar con la base de datos", error);
  }
}

// columnas de envio de pedidos: todas aceptan null para que los pedidos viejos sigan siendo validos
const COLUMNAS_ENVIO = [
  ["tipo_entrega", "ENUM('domicilio','agencia') NULL"],
  ["cedula", "VARCHAR(10) NULL"],
  ["departamento", "VARCHAR(20) NULL"],
  ["ciudad", "VARCHAR(100) NULL"],
  ["direccion", "VARCHAR(200) NULL"],
  ["agencia", "VARCHAR(150) NULL"],
  ["comentario", "VARCHAR(300) NULL"],
];

// seguimiento del envio: estado_envio null significa "por despachar" solo en pedidos pagados con envio,
// por eso el webhook de pagos no necesita tocarlo
const COLUMNAS_SEGUIMIENTO = [
  ["estado_envio", "ENUM('por_despachar','enviado','entregado') NULL"],
  ["nro_seguimiento", "VARCHAR(60) NULL"],
  ["enviado_en", "DATETIME NULL"],
];

// costos para calcular margenes: null significa "costo desconocido", nunca se asume 0.
// pedido_items.costo_unitario es una foto del costo al momento de la venta, asi el margen historico
// no cambia si despues se edita productos.costo
const COLUMNAS_COSTO = [
  ["productos", "costo", "DECIMAL(10,2) NULL"],
  ["pedido_items", "costo_unitario", "DECIMAL(10,2) NULL"],
];

// agrega la columna si no existe (los nombres vienen de la constante de arriba, nunca de un usuario)
async function agregarColumnaSiFalta(tabla, columna, definicion) {
  const [existe] = await baseDatos.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tabla, columna]
  );
  if (existe.length === 0) {
    await baseDatos.query(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
    console.log(`columna ${tabla}.${columna} creada`);
  }
}

// agrega lo que le falte a la base: la columna "activo" (borrado logico de productos), las columnas
// de envio y de seguimiento de pedidos y las de costo. es idempotente: si ya existen no hace nada
async function asegurarEsquema() {
  const [cols] = await baseDatos.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'activo'`
  );
  if (cols.length === 0) {
    await baseDatos.query(
      "ALTER TABLE productos ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1"
    );
    console.log("columna productos.activo creada");
  }

  const [colsPedidos] = await baseDatos.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos'`
  );
  const existentes = new Set(colsPedidos.map((col) => col.COLUMN_NAME));
  const faltantes = [...COLUMNAS_ENVIO, ...COLUMNAS_SEGUIMIENTO].filter(([nombre]) => !existentes.has(nombre));

  if (faltantes.length > 0) {
    const agregados = faltantes.map(([nombre, definicion]) => `ADD COLUMN ${nombre} ${definicion}`).join(", ");
    await baseDatos.query(`ALTER TABLE pedidos ${agregados}`);
    console.log("columnas nuevas creadas en pedidos:", faltantes.map(([nombre]) => nombre).join(", "));
  }

  for (const [tabla, columna, definicion] of COLUMNAS_COSTO) {
    await agregarColumnaSiFalta(tabla, columna, definicion);
  }
}

baseDatos.asegurarEsquema = asegurarEsquema;

testConexion();

module.exports = baseDatos;