const express = require("express");
const cors = require("cors");
const rutaProductos = require("./routes/products.routes");
const cartRoutes= require ("./routes/cart.routes")
const adminRoute= require ("./routes/admin.routes")
const imagenesRoutes = require("./routes/imagenes.routes");

const app = express();
const PORT= process.env.PORT || 4000;


app.use(cors());
app.use(express.json());


app.use("/api/productos", rutaProductos);
app.use("/api/cart", cartRoutes);
app.use ("/api/login", adminRoute)
app.use("/api/imagenes", imagenesRoutes);


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});