const { iniciarSesion } = require("./auth.service");
const { duracionDelToken, segundosRestantes, ahoraEnSegundos } = require("./sesion");

const ES_PRODUCCION = process.env.NODE_ENV === "production";

// opciones de la cookie del token, las mismas para crearla y para borrarla
// sameSite "none" hace falta en produccion porque el front y el back viven en dominios distintos
const opcionesCookie = {
  httpOnly: true,
  secure: ES_PRODUCCION,
  sameSite: ES_PRODUCCION ? "none" : "lax",
};

// recibe el usuario y la contrasena que manda admin.jsx y guarda el token en una cookie httpOnly
async function login(req, res) {
  // en express 5 el body es undefined si la peticion no trae json
  const { user, password } = req.body ?? {};

  if (user === undefined || password === undefined) {
    return res.status(400).json({ mensaje: "faltan el usuario y la contrasena" });
  }

  try {
    const token = await iniciarSesion(user, password);

    res.cookie("token", token, {
      ...opcionesCookie,
      maxAge: duracionDelToken(segundosRestantes(ahoraEnSegundos(), ahoraEnSegundos())) * 1000,
    });

    res.json({ mensaje: "sesion iniciada" });
  } catch (error) {
    // solo "credenciales incorrectas" se le dice a quien intenta entrar; cualquier otro fallo (configuracion,
    // secreto del token, etc.) es un error del servidor: se registra el motivo (nunca el body) y se responde generico
    if (error.status === 401) {
      return res.status(401).json({ mensaje: "credenciales incorrectas" });
    }

    console.error("error al iniciar sesion:", error.code || error.name, error.message);
    res.status(500).json({ mensaje: "error interno del servidor" });
  }
}

// borra la cookie del token, asi el navegador deja de mandarla
async function logout(req, res) {
  res.clearCookie("token", opcionesCookie);
  res.json({ mensaje: "sesion cerrada" });
}

module.exports = { login, logout, opcionesCookie };
