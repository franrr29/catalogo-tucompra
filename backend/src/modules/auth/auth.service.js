require("dotenv").config();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const crearError = require("../../utils/crearError");
const { verificarPassword, esHashValido } = require("./auth.hash");

// compara dos textos en tiempo constante (se comparan sus sha-256, que siempre miden lo mismo)
function textosIguales(a, b) {
  const hashA = crypto.createHash("sha256").update(String(a)).digest();
  const hashB = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

let avisoTextoPlanoMostrado = false;

// verifica la contrasena contra ADMIN_PASSWORD_HASH (scrypt). mientras dure la migracion, si no hay un hash valido
// y existe ADMIN_PASSWORD, se usa esa en texto plano y se avisa en el log: asi nadie se queda sin entrar al panel
async function contrasenaCorrecta(password) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const textoPlano = process.env.ADMIN_PASSWORD;

  if (hash && esHashValido(hash)) {
    return verificarPassword(password, hash);
  }

  if (textoPlano) {
    if (!avisoTextoPlanoMostrado) {
      avisoTextoPlanoMostrado = true;
      console.warn(
        hash
          ? "ADMIN_PASSWORD_HASH no tiene el formato esperado: se usa ADMIN_PASSWORD en texto plano. Genera un hash nuevo con scripts/generar-hash-admin.js."
          : "ADMIN_PASSWORD esta en texto plano (obsoleto): genera un hash con scripts/generar-hash-admin.js y cargalo en ADMIN_PASSWORD_HASH."
      );
    }
    return textosIguales(password, textoPlano);
  }

  // sin ninguna de las dos variables es un problema de configuracion, no de credenciales
  throw crearError("falta configurar ADMIN_PASSWORD_HASH", 500);
}

async function iniciarSesion(user, password) {
  const usuario = process.env.ADMIN_USER;

  // siempre se hacen las dos comprobaciones, asi no se nota por el tiempo de respuesta si fallo el usuario o la clave
  const usuarioOk = typeof user === "string" && Boolean(usuario) && textosIguales(user, usuario);
  const claveOk = typeof password === "string" && (await contrasenaCorrecta(password));

  if (!usuarioOk || !claveOk) {
    throw crearError("credenciales incorrectas", 401);
  }

  const token = jwt.sign(
    { user: usuario },
    process.env.SECRET_PASSW,
    { expiresIn: "1h" }
  );

  return token;
}

module.exports = { iniciarSesion };
