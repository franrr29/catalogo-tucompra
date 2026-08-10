const { Router } = require("express");
const middleVerificador = require("../../middleware/auth.middle");
const {
  subirMiddleware,
  subirImagenesProducto,
  listarImagenesProducto,
  borrarImagen,
  elegirImagenPrincipal,
} = require("./imagenes.controller");

const router = Router();

router.post("/:productoId", subirMiddleware, subirImagenesProducto);

router.get("/:productoId", listarImagenesProducto);

router.delete("/:imagenId", middleVerificador, borrarImagen);

router.patch("/:imagenId", middleVerificador, elegirImagenPrincipal);

module.exports = router;
