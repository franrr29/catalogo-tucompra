const baseDatos = require("../../config/db");

async function actualizarDatosFront(productId) {

  try {
    const [rows] = await baseDatos.query("SELECT * FROM productos WHERE id=? AND activo = 1",
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
      `SELECT * FROM productos WHERE activo = 1 AND id IN (${placeholders})`,
      productosIds
    );
    return rows;
  } catch (error) {
    throw error
  }
}

module.exports = { actualizarDatosFront, verificarProdcBD }
