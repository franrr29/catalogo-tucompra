const baseDatos = require("../../config/db");
const { cloudinary } = require("../../config/cloudinary");
const crearError = require("../../utils/crearError");

const { COLUMNAS_PUBLICAS, UNION_IMAGEN_PRINCIPAL } = require("./productos.sql");

async function obtenerProductos() {
  const query = `
    SELECT ${COLUMNAS_PUBLICAS}, i.imagen_url
    FROM productos p ${UNION_IMAGEN_PRINCIPAL}
    WHERE p.activo = 1
  `;

  const [productos] = await baseDatos.query(query);
  return productos;
}

// lo mismo que el listado publico (mismos productos, mismas columnas) mas el costo; solo para el panel
async function obtenerProductosAdmin() {
  const query = `
    SELECT ${COLUMNAS_PUBLICAS}, p.costo, i.imagen_url
    FROM productos p ${UNION_IMAGEN_PRINCIPAL}
    WHERE p.activo = 1
  `;

  const [productos] = await baseDatos.query(query);
  return productos;
}

// costo de un producto con tres estados distintos:
//   undefined (no enviado) -> se devuelve undefined: no se toca la columna
//   null o texto vacio     -> null: costo desconocido (NULL en la base)
//   0 o mayor              -> el numero: 0 es un costo valido
const COSTO_MAXIMO = 99999999.99; // lo que entra en DECIMAL(10,2)
function leerCosto(costo) {
  if (costo === undefined) return undefined;
  if (costo === null || (typeof costo === "string" && costo.trim() === "")) return null;
  if (typeof costo !== "number" && typeof costo !== "string") {
    throw crearError("el costo debe ser un numero mayor o igual a 0", 400);
  }
  const numero = Number(costo);
  if (!Number.isFinite(numero) || numero < 0 || numero > COSTO_MAXIMO) {
    throw crearError("el costo debe ser un numero mayor o igual a 0", 400);
  }
  return numero;
}

async function obtenerProductoPorId(id) {
  if (isNaN(id)) {
    throw crearError("id invalido", 400);
  }

  const [rows] = await baseDatos.query(
    `SELECT ${COLUMNAS_PUBLICAS}, pi.id AS foto_id, pi.imagen_url AS foto_url, pi.orden AS foto_orden
     FROM productos p
     LEFT JOIN producto_imagenes pi ON pi.producto_id = p.id
     WHERE p.id = ? AND p.activo = 1
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

// limpia la descripcion: vacia = null (el frontend usa entonces el texto por defecto)
function normalizarDescripcion(descripcion) {
  if (descripcion === undefined || descripcion === null) return null;
  if (typeof descripcion !== "string") {
    throw crearError("descripcion no valida", 400);
  }
  const limpia = descripcion.trim();
  if (limpia.length > 2000) {
    throw crearError("la descripcion no puede superar los 2000 caracteres", 400);
  }
  return limpia === "" ? null : limpia;
}

async function crearProducto({ nombre, precio, stock, descripcion, costo }) {
  const precioNum = Number(precio);
  const stockNum = Number(stock);
  // sin costo enviado queda null (desconocido)
  const costoNum = leerCosto(costo) ?? null;

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
    INSERT INTO productos (nombre, precio, stock, descripcion, costo)
    VALUES (?,?,?,?,?)
  `;

  const [resultado] = await baseDatos.query(query, [
    nombre.trim(),
    precioNum,
    stockNum,
    normalizarDescripcion(descripcion),
    costoNum,
  ]);

  return {
    id: resultado.insertId,
    nombre,
    precio: precioNum,
    stock: stockNum,
  };
}

async function actualizarProducto(id, { nombre, precio, stock, imagen, descripcion, costo }) {
  if (isNaN(id) || id < 0) {
    throw crearError("el id debe ser un numero valido", 400);
  }

  if (!nombre && !precio && !stock && !imagen && descripcion === undefined && costo === undefined) {
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

  if (descripcion !== undefined) {
    campos.push("descripcion = ?");
    valores.push(normalizarDescripcion(descripcion));
  }

  // costo no enviado no se toca; vacio guarda NULL; 0 es valido
  if (costo !== undefined) {
    campos.push("costo = ?");
    valores.push(leerCosto(costo));
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

  const [existe] = await baseDatos.query(
    "SELECT id FROM productos WHERE id = ? AND activo = 1",
    [id]
  );
  if (existe.length === 0) {
    throw crearError("producto no encontrado", 404);
  }

  // si el producto ya fue vendido, se oculta (borrado logico) para no romper el
  // historial de pedidos; las fotos se conservan porque los pedidos pueden usarlas
  const [pedidos] = await baseDatos.query(
    "SELECT 1 FROM pedido_items WHERE producto_id = ? LIMIT 1",
    [id]
  );
  if (pedidos.length > 0) {
    await baseDatos.query("UPDATE productos SET activo = 0 WHERE id = ?", [id]);
    return;
  }

  // sin pedidos: borrado real. primero la base de datos y despues cloudinary,
  // asi un fallo en la base no deja al producto sin fotos
  const [rows] = await baseDatos.query(
    "SELECT * FROM producto_imagenes WHERE producto_id = ?",
    [id]
  );

  const [resultado] = await baseDatos.query("DELETE FROM productos WHERE id = ?", [id]);
  if (resultado.affectedRows === 0) {
    throw crearError("producto no encontrado", 404);
  }

  // producto_imagenes se borro sola (ON DELETE CASCADE); ahora se limpia cloudinary.
  // si alguna foto falla no se revierte el borrado, solo queda registrado
  const resultados = await Promise.allSettled(
    rows.map((imagen) => {
      const posicion = imagen.imagen_url.indexOf("upload/") + 7;
      const resto = imagen.imagen_url.slice(posicion);
      const partes = resto.split("/");
      partes.shift();
      const publicId = partes.join("/").split(".")[0];
      return cloudinary.uploader.destroy(publicId);
    })
  );
  resultados.forEach((r) => {
    if (r.status === "rejected") {
      console.error("no se pudo borrar una imagen en cloudinary:", r.reason);
    }
  });
}

module.exports = {
  obtenerProductos,
  obtenerProductosAdmin,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
};
