const {obtenerProductos,obtenerProductoPorId,crearProducto,actualizarProducto,eliminarProducto,} = require("./products.service");

async function listarProductos(req, res) {
  try {
    const productos = await obtenerProductos();
    res.set("Cache-Control", "public, max-age=60");
    res.json(productos);
  } catch (error) {
    console.error("error al obtener productos:", error);
    res.status(500).json({ mensaje: "error interno del servidor", detalle: error.message });
  }
}

async function obtenerProducto(req, res) {
  try {
    const id = Number(req.params.id);
    const producto = await obtenerProductoPorId(id);
    res.set("Cache-Control", "public, max-age=60");
    res.json(producto);
  } catch (error) {
    console.error("error al obtener producto completo:", error);
    res.status(error.status || 500).json({ mensaje: error.message || "error al obtener el producto" });
  }
}

async function crearNuevoProducto(req, res) {
  try {
    const { nombre, precio, stock } = req.body;
    const producto = await crearProducto({ nombre, precio, stock });
    res.json(producto);
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ error: error.message || "error al crear el producto" });
  }
}

async function actualizarProductoExistente(req, res) {
  try {
    const id = Number(req.params.id);
    const { nombre, precio, stock, imagen } = req.body;
    const resultado = await actualizarProducto(id, { nombre, precio, stock, imagen });

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
  obtenerProducto,
  crearNuevoProducto,
  actualizarProductoExistente,
  eliminarProductoExistente,
};
