require('dotenv').config();
const usuario= process.env.ADMIN_USER;
const contra=process.env.ADMIN_PASSWORD;
const claveSecrt= process.env.SECRET_PASSW;
const jwt= require ("jsonwebtoken");
const { Router } = require("express");
const router= Router ();

//===ENDPOINT POST LOGIN===//
//Captura lo que viene de Admin.jsx y crea el token o captura el error en catch

router.post ("/login", async (req, res)=> {
    try {
        const { user, password } = req.body
        if (user === usuario && password === contra){
            const token= jwt.sign (
                {user: usuario},
                claveSecrt,
                {expiresIn: "1h"}
            )
            return res.json ({token})
        } else {
            return res.status (401).json ({mensaje: "Credenciales incorrectas"})
        }
    } catch (error){    
        return res.status (500).json ({error: "Error al tratar de conseguir las credenciales"})
    }
});

module.exports= router;