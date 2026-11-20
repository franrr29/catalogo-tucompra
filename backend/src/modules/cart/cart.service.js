const baseDatos = require("../../config/db");

const { COLUMNAS_PUBLICAS, UNION_IMAGEN_PRINCIPAL } = require("../products/productos.sql");

// producto publico (sin costo) con su imagen principal
const SELECT_PRODUCTO = `SELECT ${COLUMNAS_PUBLICAS}, i.imagen_url FROM productos p ${UNION_IMAGEN_PRINCIPAL}`;

async function actualizarDatosFront(productId) {

  try {
    const [rows] = await baseDatos.query(`${SELECT_PRODUCTO} WHERE p.id = ? AND p.activo = 1`,
      [productId]
    );

    if (rows.length === 0) {
      throw new Error("Producto no existe en la base de datos")
    }

    if (rows[0].stock < 1) {
      throw new Error("Stock no disponible")
    }

    return rows[0];

  } catch (error) {
    throw error
  }

};


async function verificarProdcBD(productosIds) {
  
  if (!productosIds || productosIds.length === 0) {
    throw new Error("No se enviaron IDs")
  }

  try {
    // arma un signo de pregunta por cada id y los une con comas para que mysql sepa cuantos valores esperar
    const placeholders = productosIds.map(() => "?").join(", ");
    const [rows] = await baseDatos.query(
      `${SELECT_PRODUCTO} WHERE p.activo = 1 AND p.id IN (${placeholders})`,
      productosIds
    );
    return rows;
  } catch (error) {
    throw error
  }
}

module.exports = { actualizarDatosFront, verificarProdcBD }
