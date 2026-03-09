const { Router } = require("express");
const { addToCart, verificar } = require("../controllers/cart.controller");


const router = Router();

router.post("/add", addToCart);

//===ENDPOINT QUE RECIBE ID PARA VER SI ESTAN AGREGADOS YA EN EL CARRITO===//
router.post ("/verificar", verificar )


module.exports = router;