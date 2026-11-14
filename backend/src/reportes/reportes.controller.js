const { masVendidosService, ventasPorDepartamentoService, margenService } = require("./reportes.service");

// responde un error de validacion con su status, o un 500 generico sin datos internos
function responderError(res, error, contexto) {
  if (error.status) {
    return res.status(error.status).json({ mensaje: error.message });
  }
  console.error(`error al ${contexto}:`, error.code || error.name, error.message);
  res.status(500).json({ mensaje: "error interno del servidor" });
}

// GET /api/admin/reportes/mas-vendidos?periodo=&orden=&limite=
async function masVendidos(req, res) {
  try {
    const { periodo, orden, limite } = req.query;
    res.json(await masVendidosService({ periodo, orden, limite }));
  } catch (error) {
    responderError(res, error, "obtener los productos mas vendidos");
  }
}

// GET /api/admin/reportes/departamentos?periodo=
async function ventasPorDepartamento(req, res) {
  try {
    res.json(await ventasPorDepartamentoService({ periodo: req.query.periodo }));
  } catch (error) {
    responderError(res, error, "obtener las ventas por departamento");
  }
}

// GET /api/admin/reportes/margen?periodo=
async function margen(req, res) {
  try {
    res.json(await margenService({ periodo: req.query.periodo }));
  } catch (error) {
    responderError(res, error, "calcular el margen");
  }
}

module.exports = { masVendidos, ventasPorDepartamento, margen };
