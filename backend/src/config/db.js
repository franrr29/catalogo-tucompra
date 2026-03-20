//===Conexion a la base de datos===//
require('dotenv').config();

const baseDatos = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
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