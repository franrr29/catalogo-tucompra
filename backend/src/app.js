//--- IMPORTS ---
const express = require("express");
const cors = require("cors"); //===PARA QUE AMBOS PUERTOS DE FRONT Y BACK CONECTEN===//
const rutaProductos = require("./routes/products.routes");
const cartRoutes= require ("./routes/cart.routes")
const adminRoute= require ("./routes/admin.routes")

//--- APP ---
const app = express();
const PORT = 4000;


//--- MIDDLEWARES ---
app.use(cors());         
app.use(express.json());   


//--- RUTAS ---
app.use("/api/productos", rutaProductos);
app.use("/api/cart", cartRoutes);
app.use ("/api/login", adminRoute)



//--- SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor creado y escuchando en el puerto ${PORT}`);
});