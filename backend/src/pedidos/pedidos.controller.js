const { crearPedidoService, obtenerEstadoPedidoService } = require("./pedidos.service");

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

// devuelve solo { estado } de un pedido, para que la pagina de pago exitoso confirme el pago
async function obtenerEstadoPedido(req, res) {
  try {
    const resultado = await obtenerEstadoPedidoService(req.params.id);
    // el estado cambia cuando llega el webhook, no se debe cachear
    res.set("Cache-Control", "no-store");
    res.json(resultado);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ mensaje: error.message });
    }
    console.error("error al obtener el estado del pedido:", error);
    res.status(500).json({ mensaje: "error interno del servidor" });
  }
}

module.exports = { crearPedido, obtenerEstadoPedido };