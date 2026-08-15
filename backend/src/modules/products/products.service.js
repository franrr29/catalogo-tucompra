const baseDatos = require("../../config/db");
const { cloudinary } = require("../../config/cloudinary");
const crearError = require("../../utils/crearError");

async function obtenerProductos() {
  const query = `
    SELECT p.*, i.imagen_url
    FROM productos p
    LEFT JOIN (
      SELECT producto_id, imagen_url
      FROM producto_imagenes
      WHERE orden = 0
    ) i ON p.id = i.producto_id
  `;

  const [productos] = await baseDatos.query(query);
  return productos;
}

async function obtenerProductoPorId(id) {
  if (isNaN(id)) {
    throw crearError("id invalido", 400);
  }

  const [rows] = await baseDatos.query(
    `SELECT p.*, pi.id AS foto_id, pi.imagen_url AS foto_url, pi.orden AS foto_orden
     FROM productos p
     LEFT JOIN producto_imagenes pi ON pi.producto_id = p.id
     WHERE p.id = ?
     ORDER BY pi.orden ASC`,
    [id]
  );

  if (rows.length === 0) {
    throw crearError("producto no encontrado", 404);
  }

  const { foto_id, foto_url, foto_orden, ...productoBase } = rows[0];

  return {
    ...productoBase,
    imagenes: rows
      .filter((r) => r.foto_id !== null)
      .map((r) => ({ id: r.foto_id, url: r.foto_url, orden: r.foto_orden })),
  };
}

async function crearProducto({ nombre, precio, stock }) {
  const precioNum = Number(precio);
  const stockNum = Number(stock);

  if (
    !nombre ||
    !nombre.trim() ||
    isNaN(precioNum) ||
    precioNum <= 0 ||
    isNaN(stockNum) ||
    stockNum < 0
  ) {
    throw crearError("todos los campos deben estar correctos", 400);
  }

  const query = `
    INSERT INTO productos (nombre, precio, stock)
    VALUES (?,?,?)
  `;

  const [resultado] = await baseDatos.query(query, [
    nombre.trim(),
    precioNum,
    stockNum,
  ]);

  return {
    id: resultado.insertId,
    nombre,
    precio: precioNum,
    stock: stockNum,
  };
}

async function actualizarProducto(id, { nombre, precio, stock, imagen }) {
  if (isNaN(id) || id < 0) {
    throw crearError("el id debe ser un numero valido", 400);
  }

  if (!nombre && !precio && !stock && !imagen) {
    return { sinCambios: true };
  }

  if (nombre !== undefined && !nombre.trim()) {
    throw crearError("nombre no valido", 400);
  }

  if (imagen !== undefined && !imagen.trim()) {
    throw crearError("imagen no valida", 400);
  }

  const campos = [];
  const valores = [];

  if (nombre !== undefined) {
    campos.push("nombre = ?");
    valores.push(nombre);
  }

  if (precio !== undefined) {
    const precioNum = Number(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      throw crearError("el precio debe ser un numero valido mayor a 0", 400);
    }
    campos.push("precio = ?");
    valores.push(precioNum);
  }

  if (stock !== undefined) {
    const stockNum = Number(stock);
    if (isNaN(stockNum) || stockNum < 0) {
      throw crearError("el stock debe ser un numero valido mayor o igual a 0", 400);
    }
    campos.push("stock = ?");
    valores.push(stockNum);
  }

  if (imagen !== undefined) {
    campos.push("imagen = ?");
    valores.push(imagen);
  }

  if (campos.length === 0) {
    throw crearError("no se enviaron campos para actualizar", 400);
  }

  const setCampos = campos.join(", ");
  const query = `UPDATE productos SET ${setCampos} WHERE id = ?`;
  valores.push(id);

  const [resultado] = await baseDatos.query(query, valores);

  if (resultado.affectedRows === 0) {
    throw crearError("producto no encontrado", 404);
  }

  return { sinCambios: false };
}

async function eliminarProducto(id) {
  if (isNaN(id) || id < 0) {
    throw crearError("el id debe ser un numero valido", 400);
  }

  const [rows] = await baseDatos.query(
    "SELECT * FROM producto_imagenes WHERE producto_id = ?",
    [id]
  );

  if (rows.length > 0) {
    // borra en cloudinary las imagenes asociadas antes de borrar el producto
    const eliminarCloudinary = rows.map((imagen) => {
      const posicion = imagen.imagen_url.indexOf("upload/") + 7;
      const resto = imagen.imagen_url.slice(posicion);
      const partes = resto.split("/");
      partes.shift();
      const publicId = partes.join("/").split(".")[0];
      return cloudinary.uploader.destroy(publicId);
    });
    await Promise.all(eliminarCloudinary);
  }

  const [resultado] = await baseDatos.query(
    "DELETE FROM productos WHERE id = ?",
    [id]
  );

  if (resultado.affectedRows === 0) {
    throw crearError("producto no encontrado", 404);
  }
}

module.exports = {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
};
