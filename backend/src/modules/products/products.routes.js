const { Router } = require("express");
const middleVerificador = require("../../middleware/auth.middle");
const {
  listarProductos,
  obtenerProducto,
  crearNuevoProducto,
  actualizarProductoExistente,
  eliminarProductoExistente,
} = require("./products.controller");

const router = Router();

router.get("/", listarProductos);

router.get("/:id", obtenerProducto);

router.post("/", middleVerificador, crearNuevoProducto);

router.patch("/:id", middleVerificador, actualizarProductoExistente);

router.delete("/:id", middleVerificador, eliminarProductoExistente);

module.exports = router;
