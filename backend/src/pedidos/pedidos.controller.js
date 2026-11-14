const { crearPedidoService, obtenerEstadoPedidoService } = require("./pedidos.service");
const { validarDatosPedido } = require("./pedidos.validacion");

// crea un pedido nuevo
async function crearPedido(req, res) {

  try {
    // en express 5 el body es undefined si la peticion no trae json
    const body = req.body ?? {};
    const { nombre, email, telefono, items } = body;

    if (!nombre || !email || !telefono || !Array.isArray(items) || items.length === 0) {

      return res.status(400).json({ mensaje: "Faltan datos requeridos" });
    }

    // valida y normaliza contacto y envio antes de tocar la base o mercado pago
    const datos = validarDatosPedido(body);

    const pedido = await crearPedidoService(datos.nombre, datos.email, datos.telefono, items, datos.envio);

    res.json({ mensaje: "Pedido creado exitosamente", pedido });

  } catch (error) {

    // los errores con status (validaciones, stock) son mensajes pensados para el cliente
    if (error.status) {
      const cuerpo = { mensaje: error.message };
      if (error.campo) cuerpo.campo = error.campo;
      return res.status(error.status).json(cuerpo);
    }

    // error inesperado: se registra solo el motivo (nunca el body ni el error completo, que pueden
    // tener datos personales) y al cliente se le responde un mensaje generico
    console.error("error al crear el pedido:", error.code || error.name, error.message);
    res.status(500).json({ mensaje: "error interno del servidor" });
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