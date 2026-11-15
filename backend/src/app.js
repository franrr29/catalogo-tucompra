const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rutaProductos = require("./modules/products/products.routes");
const cartRoutes= require ("./modules/cart/cart.routes")
const adminRoute= require ("./modules/auth/auth.routes")
const imagenesRoutes = require("./modules/imagenes/imagenes.routes");
const pedidosRoutes = require("./../src/pedidos/pedidos.routes");
const pedidosAdminRoutes = require("./pedidos/pedidos.admin.routes");
const webhookRoutes = require("./webhook/webhook.routes");
const productosAdminRoutes = require("./modules/products/products.admin.routes");
const reportesRoutes = require("./reportes/reportes.routes");
const { leerSaltosDeProxy } = require("./middleware/limiteLogin");

const app = express();
const PORT= process.env.PORT || 4000;

// detras del balanceador de render, req.ip seria siempre la ip del proxy y el limite de login se aplicaria a todos
// juntos. PROXY_SALTOS es la cantidad de proxies confiables delante del backend (1 por defecto); 0 = sin proxy (local)
app.set("trust proxy", leerSaltosDeProxy(process.env.PROXY_SALTOS));

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
// ventas del panel de admin, protegidas con verificarToken
app.use("/api/admin/pedidos", pedidosAdminRoutes);
// productos con costo y reportes de rentabilidad: solo admin
app.use("/api/admin/productos", productosAdminRoutes);
app.use("/api/admin/reportes", reportesRoutes);

// el esquema debe estar listo antes de atender requests; si falla, el deploy se cancela
// y Render conserva la version anterior en linea
require("./config/db")
  .asegurarEsquema()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("no se pudo preparar la base de datos:", error);
    process.exit(1);
  });
