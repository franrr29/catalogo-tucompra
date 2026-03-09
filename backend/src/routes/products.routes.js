//---RUTA PARA CONECTAR Y HACER QUERYS A LA BASE DE DATOS---//

const baseDatos = require("../config/db");
const express= require ("express");
const router= express.Router ()


//---ENDPOINT PARA GET PRODUCTOS EN BASE DATOS---//

router.get ("/", async (req, res)=>{
    try {
        const [rows]= await baseDatos.query ("SELECT * FROM productos") //Aca usamos destructuring porque al usar pool/promesas, devuelve siempre ROWS, FIELDS
        res.json (rows);
    } catch (error){
        console.error (error);
        res.status (500).json ({mensaje: "Error al traer productos de la base de datos"})
    }
});



//---ENDPOINT PARA GET PRODUCTO POR ID---//

router.get("/:id", async (req, res) => {
  try {
    const id= Number (req.params.id)

    if (isNaN (id)){
        return res.status(400).json ({mensaje: "El ID debe ser un numero"})
    }

    const [rows] = await baseDatos.query(
      "SELECT * FROM productos WHERE id = ? LIMIT 1", //Limité la busqueda a 1 prod
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.json(rows[0]); //Aca va [0] porque ROWS siempre devuelve un array y este es 0 ya que devuelve un unico elemento que coincida con la busqueda
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el producto" });
  }
});



//---ENDPOINT POST PARA CREAR PRODUCTOS COMO ADMIN Y AÑADIR A LA BASE DATOS---//

router.post("/", async (req, res) => {
  try {
    const { nombre, precio, stock, imagen } = req.body;

    if (
      !nombre?.trim () ||
      !imagen?.trim() ||
      Number (stock) <0 ||
      Number (precio) <=0
    ){
      return res.status (400).json ({error: "Todos los campos deben estar correctos"})
    }

    const query = `
      INSERT INTO productos (nombre, precio, stock, imagen)
      VALUES (?,?,?,?)
    `;

    await baseDatos.query(query, [nombre, precio, stock, imagen]);

    res.json({ mensaje: "Producto creado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el producto" });
  }
});


//---ENDPOINT PATCH (actualiza solo algunos campos) PARA ACTUALIZAR PRODUCTO COMO ADMIN (nombre, precio, stock, imagen)---//

router.patch ("/:id", async (req, res)=>{
  try {

    const id= Number (req.params.id);
    
    if (isNaN (id) || id < 0){
      return res.status (400).json ({mensaje: "El ID debe ser un numero valido"})
    }

    const {nombre, precio, stock, imagen}= req.body
    
    
    if (nombre === undefined &&
      precio === undefined &&
      stock === undefined &&
      imagen === undefined
    ){
      return res.status(400).json ({mensaje: "Debes enviar al menos un campo para actualizar"})
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




//---ENDPOINT PARA ELIMINAR PRODUCTOS COMO ADMIN EN LA BASE DE DATOS---//

router.delete("/:id", async (req, res) => {
  try {
    
    const id= Number (req.params.id)
     
    if (isNaN (id) || id <0){
      return res.status(400).json ({mensaje: "El ID debe ser un numero valido"})
    }
    const query = "DELETE FROM productos WHERE id = ?";

      //---VALIDAR QUE EL PRODUCTO EXISTA PARA ELIMINAR---//
      
    const [resultado]= await baseDatos.query (query, [id])
    if (resultado.affectedRows ===0){
      return res.status (404).json ({mensaje: "Producto no encontrado"})
    }

    res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al borrar el producto" });
  }
});




//---EXPORTAR ROUTER---//
module.exports= router; 