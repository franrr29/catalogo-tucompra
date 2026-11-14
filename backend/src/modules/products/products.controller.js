const {obtenerProductos,obtenerProductosAdmin,obtenerProductoPorId,
  crearProducto,actualizarProducto,eliminarProducto,} = require("./products.service");

// el publico cachea 60s; el panel de admin pide ?fresh=1 para ver sus cambios al instante
// (no es un riesgo: el servidor no cachea nada, siempre consulta la base)
function cabeceraDeCache(req, res) {
  res.set("Cache-Control", req.query.fresh ? "no-store" : "public, max-age=60");
}

async function listarProductos(req, res) {
  try {
    const productos = await obtenerProductos();
    cabeceraDeCache(req, res);
    res.json(productos);
  } catch (error) {
    console.error("error al obtener productos:", error);
    res.status(500).json({ mensaje: "error interno del servidor" });
  }
}

// GET /api/admin/productos: los mismos productos que el listado publico, mas el costo (la ruta va con verificarToken)
async function listarProductosAdmin(req, res) {
  try {
    const productos = await obtenerProductosAdmin();
    res.json(productos);
  } catch (error) {
    console.error("error al obtener productos del panel:", error.code || error.name);
    res.status(500).json({ mensaje: "error interno del servidor" });
  }
}

async function obtenerProducto(req, res) {
  try {
    const id = Number(req.params.id);
    const producto = await obtenerProductoPorId(id);
    cabeceraDeCache(req, res);
    res.json(producto);
  } catch (error) {
    console.error("error al obtener producto completo:", error);
    res.status(error.status || 500).json({ mensaje: error.message || "error al obtener el producto" });
  }
}

async function crearNuevoProducto(req, res) {
  try {
    const { nombre, precio, stock, descripcion, costo } = req.body;
    const producto = await crearProducto({ nombre, precio, stock, descripcion, costo });
    res.json(producto);
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ error: error.message || "error al crear el producto" });
  }
}

async function actualizarProductoExistente(req, res) {
  try {
    const id = Number(req.params.id);
    const { nombre, precio, stock, imagen, descripcion, costo } = req.body;
    const resultado = await actualizarProducto(id, { nombre, precio, stock, imagen, descripcion, costo });

    if (resultado.sinCambios) {
      return res.status(200).json({ mensaje: "sin cambios en datos del producto" });
    }

    res.json({ mensaje: "producto actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ mensaje: error.message || "error al tratar de actualizar el producto" });
  }
}

async function eliminarProductoExistente(req, res) {
  try {
    const id = Number(req.params.id);
    await eliminarProducto(id);
    res.json({ mensaje: "producto eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ error: error.message || "error al borrar el producto" });
  }
}

module.exports = {
  listarProductos,
  listarProductosAdmin,
  obtenerProducto,
  crearNuevoProducto,
  actualizarProductoExistente,
  eliminarProductoExistente,
};
