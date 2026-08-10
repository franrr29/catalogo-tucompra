const { Router } = require("express");
const middleVerificador = require("../../middleware/auth.middle");
const { login, logout } = require("./auth.controller");

const router = Router();

router.post("/login", login);

router.post("/logout", logout);

// si esta ruta responde ok, el middleware ya confirmo que la cookie es valida
router.get("/me", middleVerificador, (req, res) => {
  res.json({ mensaje: "autenticado" });
});

module.exports = router;
