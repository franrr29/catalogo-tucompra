const express = require("express");
const cors = require("cors");
const rutaProductos = require("./modules/products/products.routes");
const cartRoutes= require ("./modules/cart/cart.routes")
const adminRoute= require ("./modules/auth/auth.routes")
const imagenesRoutes = require("./modules/imagenes/imagenes.routes");

const app = express();
const PORT= process.env.PORT || 4000;

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.use(cors());
app.use(express.json());


app.use("/api/productos", rutaProductos);
app.use("/api/cart", cartRoutes);
app.use ("/api/login", adminRoute)
app.use("/api/imagenes", imagenesRoutes);


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
