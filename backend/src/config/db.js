//===Conexion a la base de datos===//
const mysql = require('mysql2/promise'); 
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const baseDatos = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConexion() {
    try {
        const connection = await baseDatos.getConnection()
        console.log("Conectado a la base de datos")
        connection.release()
    } catch (error) {
        console.log("Error al conectar con la base de datos", error)
    }
}

testConexion()

module.exports= baseDatos; 