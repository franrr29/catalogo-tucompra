//===Conexion a la base de datos===//
require('dotenv').config();

const dbPasswrd= process.env.DATA_BASE_PASSW
const mysql= require ("mysql2/promise")
const baseDatos= mysql.createPool ({
    host: "localhost",
    user: "root",
    password: dbPasswrd,
    database: "tu_compra"
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