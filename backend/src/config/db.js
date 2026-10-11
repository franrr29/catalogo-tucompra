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

// agrega la columna "activo" si la base todavia no la tiene (borrado logico de productos)
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
}

baseDatos.asegurarEsquema = asegurarEsquema;

testConexion();

module.exports = baseDatos;