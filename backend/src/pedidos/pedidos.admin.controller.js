const {
  listarPedidosService,
  obtenerPedidoAdminService,
  actualizarEnvioService,
  pedidosNuevosService,
} = require("./pedidos.admin.service");

// responde un error de las validaciones con su status, o un 500 generico sin datos internos ni personales
function responderError(res, error, contexto) {
  if (error.status) {
    return res.status(error.status).json({ mensaje: error.message });
  }
  // solo se registra el motivo: el error completo puede traer datos del pedido
  console.error(`error al ${contexto}:`, error.code || error.name, error.message);
  res.status(500).json({ mensaje: "error interno del servidor" });
}

// GET /api/admin/pedidos?estado=&estadoEnvio=&pagina=&limite=
async function listarPedidos(req, res) {
  try {
    const { estado, estadoEnvio, pagina, limite } = req.query;
    const resultado = await listarPedidosService({ estado, estadoEnvio, pagina, limite });
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

// PATCH /api/admin/pedidos/:id/envio { estadoEnvio, nroSeguimiento? }
async function actualizarEnvio(req, res) {
  try {
    const body = req.body ?? {};
    const resultado = await actualizarEnvioService(req.params.id, {
      estadoEnvio: body.estadoEnvio,
      nroSeguimiento: body.nroSeguimiento,
    });
    res.json(resultado);
  } catch (error) {
    responderError(res, error, "actualizar el envio del pedido");
  }
}

// GET /api/admin/pedidos/nuevos?desde=<id>
async function pedidosNuevos(req, res) {
  try {
    const resultado = await pedidosNuevosService({ desde: req.query.desde });
    res.json(resultado);
  } catch (error) {
    responderError(res, error, "buscar pedidos nuevos");
  }
}

module.exports = { listarPedidos, obtenerPedido, actualizarEnvio, pedidosNuevos };
