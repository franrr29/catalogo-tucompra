const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rutaProductos = require("./modules/products/products.routes");
const cartRoutes= require ("./modules/cart/cart.routes")
const adminRoute= require ("./modules/auth/auth.routes")
const imagenesRoutes = require("./modules/imagenes/imagenes.routes");
const pedidosRoutes = require("./../src/pedidos/pedidos.routes");
const webhookRoutes = require("./webhook/webhook.routes");

const app = express();
const PORT= process.env.PORT || 4000;

app.get("/ping", (req, res) => {
  res.send("pong");
});

// agrega cabeceras http de seguridad a cada respuesta
app.use(helmet());

// solo el frontend permitido puede mandar cookies al backend
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());

// lee la cookie que manda el navegador y la deja en req.cookies
app.use(cookieParser());


app.use("/api/productos", rutaProductos);
app.use("/api/cart", cartRoutes);
app.use ("/api/login", adminRoute)
app.use("/api/imagenes", imagenesRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/pedidos", webhookRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
