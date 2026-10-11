const baseDatos = require("../../config/db");
const { cloudinary } = require("../../config/cloudinary");
const crearError = require("../../utils/crearError");

// saca el publicId de cloudinary a partir de la url guardada en la base de datos
function obtenerPublicId(imagenUrl) {
  const posicion = imagenUrl.indexOf("upload/") + 7;
  const resto = imagenUrl.slice(posicion);
  const partes = resto.split("/");
  partes.shift();
  return partes.join("/").split(".")[0];
}

async function subirImagenes(productoId, archivos) {
  if (isNaN(productoId)) {
    throw crearError("id de producto invalido", 400);
  }

  if (!archivos || archivos.length === 0) {
    throw crearError("no se enviaron imagenes", 400);
  }

  // verifica si el producto existe
  const [producto] = await baseDatos.query(
    "SELECT * FROM productos WHERE id = ? AND activo = 1",
    [productoId]
  );

  if (producto.length === 0) {
    throw crearError("producto no encontrado", 404);
  }

  // obtiene las imagenes existentes para calcular el orden de las nuevas
  const [rows] = await baseDatos.query(
    "SELECT * FROM producto_imagenes WHERE producto_id = ?",
    [productoId]
  );

  const inserts = archivos.map((file, index) =>
    baseDatos.query(
      `INSERT INTO producto_imagenes
      (producto_id, imagen_url, orden)
      VALUES (?, ?, ?)`,
      [productoId, file.path, index + rows.length]
    )
  );

  await Promise.all(inserts);

  return archivos.map((f) => f.path);
}

async function obtenerImagenesDeProducto(productoId) {
  const [rows] = await baseDatos.query(
    `SELECT * FROM producto_imagenes
     WHERE producto_id = ?
     ORDER BY orden ASC`,
    [productoId]
  );

  return rows;
}

async function eliminarImagen(imagenId) {
  if (isNaN(imagenId)) {
    throw crearError("id de imagen invalido", 400);
  }

  const [rows] = await baseDatos.query(
    "SELECT * FROM producto_imagenes WHERE id = ?",
    [imagenId]
  );

  if (rows.length === 0) {
    throw crearError("imagen no encontrada", 404);
  }

  const publicId = obtenerPublicId(rows[0].imagen_url);

  // elimina de cloudinary y despues de mysql
  await cloudinary.uploader.destroy(publicId);

  await baseDatos.query("DELETE FROM producto_imagenes WHERE id = ?", [imagenId]);
}

async function marcarImagenPrincipal(imagenId) {
  if (isNaN(imagenId)) {
    throw crearError("id de imagen invalido", 400);
  }

  const [row] = await baseDatos.query(
    "SELECT * FROM producto_imagenes WHERE id = ?",
    [imagenId]
  );

  if (row.length === 0) {
    throw crearError("imagen no encontrada en la base de datos", 404);
  }

  const productoId = row[0].producto_id;

  // resetea el orden de todas las imagenes del producto
  await baseDatos.query(
    "UPDATE producto_imagenes SET orden = 1 WHERE producto_id = ?",
    [productoId]
  );

  // pone la imagen elegida como principal
  await baseDatos.query(
    "UPDATE producto_imagenes SET orden = 0 WHERE id = ?",
    [imagenId]
  );
}

module.exports = {
  subirImagenes,
  obtenerImagenesDeProducto,
  eliminarImagen,
  marcarImagenPrincipal,
};
