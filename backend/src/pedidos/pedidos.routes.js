const { Router } = require("express");
const { crearPedido, obtenerEstadoPedido } = require("./pedidos.controller");

const router = Router();

router.post("/", crearPedido);

// publica a proposito: solo devuelve el estado del pedido, sin datos personales ni montos
router.get("/:id", obtenerEstadoPedido);

module.exports = router;