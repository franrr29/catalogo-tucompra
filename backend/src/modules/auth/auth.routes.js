const { Router } = require("express");
const middleVerificador = require("../../middleware/auth.middle");
const { login, logout } = require("./auth.controller");
const { limiteLogin } = require("../../middleware/limiteLogin");

const router = Router();

// el limite por ip frena la fuerza bruta: despues de varios intentos seguidos responde 429
router.post("/login", limiteLogin, login);

router.post("/logout", logout);

// si esta ruta responde ok, el middleware ya confirmo que la cookie es valida
router.get("/me", middleVerificador, (req, res) => {
  res.json({ mensaje: "autenticado" });
});

module.exports = router;
