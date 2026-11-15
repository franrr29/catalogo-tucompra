const jwt= require ("jsonwebtoken");
require ("dotenv").config ();
const clave=process.env.SECRET_PASSW;
const { opcionesCookie } = require ("../modules/auth/auth.controller");
const { origenPermitido } = require ("./verificarOrigen");
const { inicioDeSesion, segundosRestantes, duracionDelToken } = require ("../modules/auth/sesion");

async function verificarToken (req, res, next){
    const token = req.cookies.token;

    if (!token){
        return res.status (401).json({mensaje:"Token requerido para continuar"})
    }

    try{
        const datos = jwt.verify (token, clave, { algorithms: ["HS256"] })

        // contra CSRF: una peticion que modifica datos solo se acepta si viene del frontend (header Origin)
        if (!origenPermitido (req)){
            console.error ("peticion rechazada: origen no permitido", req.method, req.baseUrl)
            return res.status (403).json ({mensaje:"Origen no permitido"})
        }

        // limite absoluto: pasadas SESION_MAX_HORAS desde el login la sesion termina aunque se haya usado sin parar
        const inicio = inicioDeSesion (datos)
        const restante = segundosRestantes (inicio)
        if (restante <= 0){
            res.clearCookie ("token", opcionesCookie)
            return res.status (401).json ({mensaje: "Sesion expirada"})
        }

        // renueva la sesion en cada request: vence tras 1h sin actividad, pero nunca despues del limite absoluto
        const segundos = duracionDelToken (restante)
        const nuevoToken = jwt.sign ({ user: datos.user, inicio }, clave, { expiresIn: segundos })
        res.cookie ("token", nuevoToken, { ...opcionesCookie, maxAge: segundos * 1000 })
        next ()

    } catch (error){
        console.error ("Error al verificar las credenciales del token y clave", error )
        return res.status(401).json({mensaje: "Token invalido o expirado"})
    }

}

module.exports= verificarToken;
