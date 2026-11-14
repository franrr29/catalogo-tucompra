const { Router } = require("express");
const verificarToken = require("../../middleware/auth.middle");
const { listarProductosAdmin } = require("./products.controller");

const router = Router();

// todo el router es solo para el admin: incluye el costo de los productos, que nunca debe verse en la tienda
router.use(verificarToken);

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.get("/", listarProductosAdmin);

module.exports = router;
