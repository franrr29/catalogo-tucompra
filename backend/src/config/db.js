const mysql = require('mysql2/promise');

const baseDatos = mysql.createPool(process.env.DATABASE_URL);

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