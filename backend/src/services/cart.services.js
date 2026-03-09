const baseDatos = require("../config/db");


//===FUNCION ACTUALIZA DATOS DEL BACK CUANDO EL USUARIO AGREGA PROD EN CARRITO===//

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

  const updateStockBD= await baseDatos.query ("UPDATE productos SET stock = stock - 1 WHERE id = ?",
    [productId]
  )

  const [baseDatosActualizada]= await baseDatos.query ("SELECT * FROM productos WHERE id=?",
    [productId]
  )

  return baseDatosActualizada [0];



  } catch (error){
    throw error // <---RELANZAMOS EL ERROR AL CONTROLLER SINO, GENERA BUGS DIFICILES DE ENCONTRAR---
  }

};


async function verificarProdcBD(productosIds) {
  try{
    const [rows]= await baseDatos.query ("SELECT * FROM productos WHERE id IN (?)",
      [productosIds]
    )
    return rows;

  } catch (error){
    throw error
  }
}

module.exports= {actualizarDatosFront, verificarProdcBD};
