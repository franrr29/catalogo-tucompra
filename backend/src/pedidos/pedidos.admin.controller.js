const { listarPedidosService, obtenerPedidoAdminService } = require("./pedidos.admin.service");

// responde un error de las validaciones con su status, o un 500 generico sin datos internos ni personales
function responderError(res, error, contexto) {
  if (error.status) {
    return res.status(error.status).json({ mensaje: error.message });
  }
  // solo se registra el motivo: el error completo puede traer datos del pedido
  console.error(`error al ${contexto}:`, error.code || error.name, error.message);
  res.status(500).json({ mensaje: "error interno del servidor" });
}

// GET /api/admin/pedidos?estado=&pagina=&limite=
async function listarPedidos(req, res) {
  try {
    const { estado, pagina, limite } = req.query;
    const resultado = await listarPedidosService({ estado, pagina, limite });
    res.json(resultado);
  } catch (error) {
    responderError(res, error, "listar los pedidos");
  }
}

// GET /api/admin/pedidos/:id
async function obtenerPedido(req, res) {
  try {
    const pedido = await obtenerPedidoAdminService(req.params.id);
    res.json(pedido);
  } catch (error) {
    responderError(res, error, "obtener el pedido");
  }
}

module.exports = { listarPedidos, obtenerPedido };
