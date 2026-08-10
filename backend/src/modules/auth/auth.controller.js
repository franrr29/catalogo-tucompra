const { iniciarSesion } = require("./auth.service");

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
  try {
    const { user, password } = req.body;
    const token = await iniciarSesion(user, password);

    res.cookie("token", token, {
      ...opcionesCookie,
      maxAge: 60 * 60 * 1000,
    });

    res.json({ mensaje: "sesion iniciada" });
  } catch (error) {
    res.status(error.status || 500).json({ mensaje: error.message || "error al tratar de conseguir las credenciales" });
  }
}

// borra la cookie del token, asi el navegador deja de mandarla
async function logout(req, res) {
  res.clearCookie("token", opcionesCookie);
  res.json({ mensaje: "sesion cerrada" });
}

module.exports = { login, logout };
