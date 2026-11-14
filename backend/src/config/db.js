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

// agrega lo que le falte a la base: la columna "activo" (borrado logico de productos) y las columnas
// de envio y de seguimiento de pedidos. es idempotente: si ya existen no hace nada
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
}

baseDatos.asegurarEsquema = asegurarEsquema;

testConexion();

module.exports = baseDatos;