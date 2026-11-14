const { Router } = require("express");
const verificarToken = require("../middleware/auth.middle");
const { masVendidos, ventasPorDepartamento, margen } = require("./reportes.controller");

const router = Router();

// todo el router es solo para el admin: la proteccion va a nivel del router para que ninguna ruta
// que se agregue despues quede sin proteger
router.use(verificarToken);

// son datos del negocio (ingresos, costos): ningun cache debe guardarlos
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.get("/mas-vendidos", masVendidos);
router.get("/departamentos", ventasPorDepartamento);
router.get("/margen", margen);

module.exports = router;
