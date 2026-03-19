const baseDatos = require("../config/db");

//===FUNCION VERIFICA QUE EL PRODUCTO EXISTE Y TIENE STOCK, SIN MODIFICAR LA BASE DE DATOS===//

async function actualizarDatosFront(productId) {
  
  try {
    const [rows]= await baseDatos.query ("SELECT * FROM productos WHERE id=?",
      [productId]
    );

    if (rows.length===0){
      throw new Error ("Producto no existe en la base de datos")
    }

  if (rows[0].stock <1){
    throw new Error ("Stock no disponible")
  }

  return rows [0];

  } catch (error){
    throw error // <---RELANZAMOS EL ERROR AL CONTROLLER SINO, GENERA BUGS DIFICILES DE ENCONTRAR---
  }

};


async function verificarProdcBD(productosIds) {
  if (!productosIds || productosIds.length === 0) {
    throw new Error("No se enviaron IDs")
  }
  
  try {
    const placeholders = productosIds.map(() => "?").join(", "); //asigna a cada productoIds un ? y lo une con (",") asi mysql sabe cuantos valores esperar ( ?,?,?)
    const [rows] = await baseDatos.query(
      `SELECT * FROM productos WHERE id IN (${placeholders})`, 
      productosIds
    );
    return rows;
  } catch (error) {
    throw error
  }
}

module.exports= {actualizarDatosFront, verificarProdcBD}