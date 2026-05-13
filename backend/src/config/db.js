require("dotenv").config();

const mysql = require("mysql2/promise");

const baseDatos = mysql.createPool({
  uri: process.env.DATABASE_URL,
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

testConexion();

module.exports = baseDatos;