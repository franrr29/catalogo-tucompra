const { crearPedidoService } = require("./pedidos.service");

// crea un pedido nuevo
async function crearPedido(req, res) {

  try {
    const { nombre, email, telefono, items } = req.body;

    if (!nombre || !email || !telefono || !items) {
        
      return res.status(400).json({ mensaje: "Faltan datos requeridos" });
    }

    const pedido = await crearPedidoService(nombre, email, telefono, items);

    res.json({ mensaje: "Pedido creado exitosamente", pedido });

  } catch (error) {

    res.status(error.status || 500).json({ mensaje: error.message });
  }
}

module.exports = { crearPedido };