const { Router } = require("express");
const { addToCart, verificar } = require("./cart.controller");


const router = Router();

router.post("/add", addToCart);

router.post("/verificar", verificar)


module.exports = router;
