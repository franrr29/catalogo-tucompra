const { Router } = require("express");
const verificarToken = require("../middleware/auth.middle");
const { listarPedidos, obtenerPedido, actualizarEnvio, pedidosNuevos } = require("./pedidos.admin.controller");

const router = Router();

// todo el router es solo para el admin: la proteccion va a nivel del router para que ninguna ruta
// que se agregue despues quede sin proteger
router.use(verificarToken);

// estas respuestas tienen datos personales (cedula, direccion): ningun cache debe guardarlas
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.get("/", listarPedidos);

// "nuevos" va antes de "/:id": si no, se leeria como un id de pedido
router.get("/nuevos", pedidosNuevos);

router.get("/:id", obtenerPedido);

router.patch("/:id/envio", actualizarEnvio);

module.exports = router;
