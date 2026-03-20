//---RUTA PARA CONECTAR Y HACER QUERYS A LA BASE DE DATOS---//

const baseDatos = require("../config/db");
const express= require ("express");
const router= express.Router ()
const middleVerificador= require ("../middleware/auth.middle")

//--- OBTENER TODOS LOS PRODUCTOS CON SU IMAGEN PRINCIPAL ---//

router.get("/", async (req, res) => {
  try {
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
    res.json(productos);
    
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});


//--- OBTENER UN PRODUCTO CON TODAS SUS IMÁGENES ---//
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const [productos] = await baseDatos.query("SELECT * FROM productos WHERE id = ?", [id]);

    if (productos.length === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    const [fotos] = await baseDatos.query(
      "SELECT id, imagen_url, orden FROM producto_imagenes WHERE producto_id = ?", 
      [id]
    );

    const respuestaFinal = {
      ...productos[0],
      imagenes: fotos.map(f => ({ id: f.id, url: f.imagen_url, orden: f.orden }))
    };

    res.json(respuestaFinal);

  } catch (error) {
    console.error("Error al obtener producto completo:", error);
    res.status(500).json({ mensaje: "Error al obtener el producto" });
  }
});


//===ENDPOINT PARA CREAR PRODUCTO NUEVO COMO ADMIN SIN IMAGEN OBLIGATORIA Y EVITANDO AGREGAR STRINGS EN LA BD===//
router.post("/", middleVerificador, async (req, res) => {
  try {
    const { nombre, precio, stock, imagen } = req.body;

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
      return res.status(400).json({
        error: "Todos los campos deben estar correctos"
      });
    }

    const imagenProducto =
      typeof imagen === "string" && imagen.trim() !== ""
        ? imagen.trim()
        : null;

    const query = `
      INSERT INTO productos (nombre, precio, stock, imagen)
      VALUES (?,?,?,?)
    `;

    const [resultado] = await baseDatos.query(query, [
      nombre.trim(),
      precioNum,
      stockNum,
      imagenProducto
    ]);

    res.json({
      id: resultado.insertId,
      nombre,
      precio: precioNum,
      stock: stockNum,
      imagen: imagenProducto
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el producto" });
  }
});


//---ENDPOINT PATCH (actualiza solo algunos campos) PARA ACTUALIZAR PRODUCTO COMO ADMIN (nombre, precio, stock, imagen)---//

router.patch ("/:id", middleVerificador, async (req, res)=>{
  try {

    const id= Number (req.params.id);
    
    if (isNaN (id) || id < 0){
      return res.status (400).json ({mensaje: "El ID debe ser un numero valido"})
    }

    const {nombre, precio, stock, imagen}= req.body
    
    
    if (!nombre && !precio && !stock && !imagen) {
      return res.status(200).json({ mensaje: "Sin cambios en datos del producto" })
    }

    if (nombre !==undefined && !nombre.trim ()){
      return res.status (400).json ({mensaje: "Nombre no valido"})
    }

    if (imagen !==undefined && !imagen.trim ()){
      return res.status (400).json ({mensaje: "Imagen no valida"})
    }

    if (precio !==undefined && Number (precio) <=0){
      return res.status (400).json ({mensaje: "El precio debe ser mayor a 0"})
    }

    if (stock !==undefined && Number (stock) < 0){
      return res.status (400).json ({mensaje: "El stock no puede ser negativo"})
    }

    const campos= [];
    const valores=[];

    if (nombre !== undefined){
      campos.push ("nombre = ?");
      valores.push (nombre)
    }

   if (precio !== undefined) {
    const precioNum = Number(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
    return res.status(400).json({ mensaje: "El precio debe ser un número válido mayor a 0" });
  }
  campos.push("precio = ?");
  valores.push(precioNum);
}

  if (stock !== undefined) {
  const stockNum = Number(stock);
  if (isNaN(stockNum) || stockNum < 0) {
    return res.status(400).json({ mensaje: "El stock debe ser un número válido >= 0" });
  }
  campos.push("stock = ?");
  valores.push(stockNum);
}

    if (imagen !==undefined){
      campos.push ("imagen = ?")
      valores.push (imagen)
    }

    if (campos.length ===0){
      return res.status (400).json ({mensaje: "No se enviaron campos para actualizar"})
    }

    //---UNIR LOS CAMPOS Y HACER LA QUERY A BASE DATOS---//

    const setCampos= campos.join (", ")
    const query= `UPDATE productos SET  ${setCampos} WHERE id = ?`
    valores.push (id);
    
    const [resultado]= await baseDatos.query (query, valores)

    if (resultado.affectedRows ===0){
      return res.status(404).json ({mensaje: "Producto no encontrado"})
    }

    res.json ({mensaje: "Producto actualizado correctamente"})
  } catch (error){
    console.error (error)
    res.status (500).json ({error: "Error al tratar de actualizar el producto"})
  }

})



//===BORRAR PRODUCTOS DE CLOUDIANARY===//

router.delete("/:id", middleVerificador, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id) || id < 0) {
      return res.status(400).json({ mensaje: "El ID debe ser un número válido" });
    }

    const [rows] = await baseDatos.query(
      "SELECT * FROM producto_imagenes WHERE producto_id = ?", [id]
    );

    if (rows.length > 0) {
      const eliminarCloudinary = rows.map((imagen) => {
        const urlParts = imagen.imagen_url.split("/");
        const publicId = urlParts.slice(-2).join("/").split(".")[0];
        return cloudinary.uploader.destroy(publicId);
      });
      await Promise.all(eliminarCloudinary);
    }

    // BORRAR PRODUCTO
    const [resultado] = await baseDatos.query(
      "DELETE FROM productos WHERE id = ?", [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.json({ mensaje: "Producto eliminado correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al borrar el producto" });
  }
});




//---EXPORTAR ROUTER---//
module.exports= router; 