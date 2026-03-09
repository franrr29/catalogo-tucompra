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

baseDatos.getConnection ((error, connection)=>{
    if (error) {
        console.log ("Error al conectar con la base de datos", error)
    } else {
        console.log ("Conectado a la bse de datos")
        connection.release();
    }
});

module.exports= baseDatos; 