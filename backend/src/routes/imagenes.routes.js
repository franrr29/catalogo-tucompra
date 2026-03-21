//===ENDPOINT PARA SUBIR IMAGENES, BORRAR, ETC DIRECTO A LA BASE DE DATOS Y CLOUDINARY===//

const { Router } = require("express");
const { upload, cloudinary } = require("../config/cloudinary");
const baseDatos = require("../config/db");
const middleVerificador= require ("../middleware/auth.middle")
const router = Router();



//===POST SUBIR IMAGENES PARA UN PRODUCTO===//

router.post("/:productoId", middleVerificador, upload.fields([{ name: "imagenes", maxCount: 10 }]), async (req, res) => {
  try {
    const productoId = Number(req.params.productoId);

    if (isNaN(productoId)) {
      return res.status(400).json({ mensaje: "ID de producto inválido" });
    }

    const archivos = req.files?.imagenes;

    if (!archivos || archivos.length === 0) {
      return res.status(400).json({ mensaje: "No se enviaron imágenes" });
    }
  
    const [rows] = await baseDatos.query(
      "SELECT * FROM producto_imagenes WHERE producto_id = ?",
      [productoId]
    );
    
    const inserts = archivos.map((file, index) =>
      baseDatos.query(
        "INSERT INTO producto_imagenes (producto_id, imagen_url, orden) VALUES (?, ?, ?)",
        [productoId, file.path, index + rows.length]
      )
    );

    await Promise.all(inserts);
    

    res.json({
      mensaje: "Imágenes subidas correctamente",
      imagenes: archivos.map((f) => f.path),
    });
  } catch (error) {
    console.error("TIPO:", typeof error);
    console.error("ERROR:", error);
    console.error("KEYS:", Object.keys(error));
    res.status(500).json({ mensaje: String(error) });
  }
});

//===ENDPOINT GET PARA TRAER IMAGENES DE UN PRODUCTO===//

router.get("/:productoId", async (req, res) => {
  try {
    const productoId = Number(req.params.productoId);

    const [rows] = await baseDatos.query(
      "SELECT * FROM producto_imagenes WHERE producto_id = ? ORDER BY orden ASC",
      [productoId]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener imágenes" });
  }
});

//===ENDPOINT PARA ELIMINAR UNA IMAGEN===//

router.delete("/:imagenId", middleVerificador, async (req, res) => {
  try {
    const imagenId = Number(req.params.imagenId);

    if (isNaN(imagenId)) {
      return res.status(400).json({ mensaje: "ID de imagen inválido" });
    }

    const [rows] = await baseDatos.query(
      "SELECT * FROM producto_imagenes WHERE id = ?",
      [imagenId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Imagen no encontrada" });
    }

      // Busca sus imágenes en la BD y, si existen, obtiene el publicId de cada URL de Cloudinary.
      // Elimina todas las img en paralelo con promiseall
      // Luego borra el producto de la base de datos
      
     const imagen = rows[0];
     const posicion = imagen.imagen_url.indexOf("upload/") + 7;
     const resto = imagen.imagen_url.slice(posicion);
     const partes = resto.split("/");
     partes.shift();
     const publicId = partes.join("/").split(".")[0];

    await cloudinary.uploader.destroy(publicId);
    await baseDatos.query("DELETE FROM producto_imagenes WHERE id = ?", [imagenId]);

    res.json({ mensaje: "Imagen eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar la imagen" });
  }
});



//===ENDPOINT PARA SELECCIONAR QUE IMAGEN PRINCIPAL MOSTRAR COMO ADMIN===//

router.patch ("/:imagenId", middleVerificador, async (req, res)=>{
  try {
    const imagenId= Number (req.params.imagenId)
    if (isNaN(imagenId)) {
      return res.status(400).json({ mensaje: "ID de imagen inválido" });
    }

    const [row]= await baseDatos.query ("SELECT * FROM producto_imagenes WHERE id = ?", [imagenId])

    if (row.length === 0){
      return res.status(404).json ({mensaje: "Imagen no encontrada en la base de datos"})
    }
    const productoId= row[0].producto_id;
    const resetearImagenProd= await baseDatos.query(
      "UPDATE producto_imagenes SET orden = 1 WHERE producto_id = ?",
       [productoId]
      )
    const imagenPrincipalProd= await baseDatos.query(
  "UPDATE producto_imagenes SET orden = 0 WHERE id = ?",
  [imagenId]
     );
    res.json({ mensaje: "Imagen principal actualizada correctamente" })

  } catch (error){
    console.error (error)
    res.status(500).json({ mensaje: "Error al poner como favorita la imagen" });
  }
})


module.exports = router;