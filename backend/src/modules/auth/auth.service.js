require("dotenv").config();
const jwt = require("jsonwebtoken");
const crearError = require("../../utils/crearError");

const usuario = process.env.ADMIN_USER;
const contra = process.env.ADMIN_PASSWORD;
const claveSecrt = process.env.SECRET_PASSW;

async function iniciarSesion(user, password) {
  if (user !== usuario || password !== contra) {
    throw crearError("credenciales incorrectas", 401);
  }

  const token = jwt.sign(
    { user: usuario },
    claveSecrt,
    { expiresIn: "1h" }
  );

  return token;
}

module.exports = { iniciarSesion };
