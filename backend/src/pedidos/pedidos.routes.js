const { Router } = require("express");
const { crearPedido } = require("./pedidos.controller");

const router = Router();

router.post("/", crearPedido);

module.exports = router;