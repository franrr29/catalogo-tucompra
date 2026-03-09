const { actualizarDatosFront, verificarProdcBD } = require("../services/cart.services");


async function addToCart(req, res) {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        mensaje: "Falta el ID del producto",
      });
    }

    const producto = await actualizarDatosFront(productId);

    res.json({
      mensaje: "Producto agregado al carrito",
      producto,
    });

  } catch (error) {
    res.status(400).json({
      mensaje: error.message,
    });
  }
}


//=== ENDPOINT PARA VERIFICAR SI productosIds VIENE DE LA BASE DE DATOS===//

async function verificar(req, res) {
  try {
    const { productosIds } = req.body;

    if (!productosIds){
      return res.status (400).json ({mensaje: "Faltan el/los IDs de los productos"})
    }
    const carrito= await verificarProdcBD (productosIds)
      res.json ({mensaje: "Productos verificados",
        carrito
      })
    
  } catch (error){
    res.status (500).json({mensaje: error.message})
  }
  
}
module.exports = { addToCart, verificar };