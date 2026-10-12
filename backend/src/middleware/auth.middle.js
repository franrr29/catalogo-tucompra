const jwt= require ("jsonwebtoken");
require ("dotenv").config ();
const clave=process.env.SECRET_PASSW;
const { opcionesCookie } = require ("../modules/auth/auth.controller");

async function verificarToken (req, res, next){
    const token = req.cookies.token;

    if (!token){
        return res.status (401).json({mensaje:"Token requerido para continuar"})
    }

    try{
        const datos = jwt.verify (token, clave)

        // renueva la sesion en cada request: vence tras 1h sin actividad, no 1h despues del login
        const nuevoToken = jwt.sign ({ user: datos.user }, clave, { expiresIn: "1h" })
        res.cookie ("token", nuevoToken, { ...opcionesCookie, maxAge: 60 * 60 * 1000 })
        next ()

    } catch (error){
        console.error ("Error al verificar las credenciales del token y clave", error )
        return res.status(401).json({mensaje: "Token invalido o expirado"})
    }

}

module.exports= verificarToken;
