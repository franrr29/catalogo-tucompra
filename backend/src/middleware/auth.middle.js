//===MIDDLEWARE QUE VERIFICA QUE EL TOKEN===//

const jwt= require ("jsonwebtoken");
require ("dotenv").config ();
const clave=process.env.SECRET_PASSW;

async function verificarToken (req, res, next){
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
    
    if (!token){
        return res.status (401).json({mensaje:"Token requerido para continuar"})
    }
   
    try{
        jwt.verify (token, clave)
        next ()

    } catch (error){
        console.error ("Error al verificar las credenciales del token y clave", error )
        return res.status(401).json({mensaje: "Token invalido o expirado"})
    }
    
}

module.exports= verificarToken;