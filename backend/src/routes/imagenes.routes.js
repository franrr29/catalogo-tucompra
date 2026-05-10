//===ENDPOINT PARA SUBIR IMAGENES, BORRAR, ETC DIRECTO A LA BASE DE DATOS Y CLOUDINARY===//

const { Router } = require("express");
const { upload, cloudinary } = require("../config/cloudinary");
const baseDatos = require("../config/db");
const middleVerificador = require("../middleware/auth.middle");

const router = Router();


//===POST SUBIR IMAGENES PARA UN PRODUCTO===//

router.post(
  "/:productoId",

  (req, res, next) => {
    upload.fields([{ name: "imagenes", maxCount: 10 }])(req, res, (err) => {
      if (err) {
        console.log("ERROR MULTER/CLOUDINARY:");
        console.dir(err, { depth: null });

        return res.status(500).json({
          mensaje: err.message || "Error upload",
        });
      }

      next();
    });
  },

  async (req, res) => {
    try {
      const productoId = Number(req.params.productoId);

      if (isNaN(productoId)) {
        return res.status(400).json({
          mensaje: "ID de producto inválido",
        });
      }

      const archivos = req.files?.imagenes;

      if (!archivos || archivos.length === 0) {
        return res.status(400).json({
          mensaje: "No se enviaron imágenes",
        });
      }

      // Verificar si el producto existe
      const [producto] = await baseDatos.query(
        "SELECT * FROM productos WHERE id = ?",
        [productoId]
      );

      if (producto.length === 0) {
        return res.status(404).json({
          mensaje: "Producto no encontrado",
        });
      }

      // Obtener imágenes existentes
      const [rows] = await baseDatos.query(
        "SELECT * FROM producto_imagenes WHERE producto_id = ?",
        [productoId]
      );

      // Insertar imágenes nuevas
      const inserts = archivos.map((file, index) =>
        baseDatos.query(
          `INSERT INTO producto_imagenes 
          (producto_id, imagen_url, orden) 
          VALUES (?, ?, ?)`,
          [productoId, file.path, index + rows.length]
        )
      );

      await Promise.all(inserts);

      res.json({
        mensaje: "Imágenes subidas correctamente",
        imagenes: archivos.map((f) => f.path),
      });

    } catch (error) {
      console.log("ERROR COMPLETO:");
      console.dir(error, { depth: null });

      res.status(500).json({
        mensaje: error.message || "Error interno",
      });
    }
  }
);


//===ENDPOINT GET PARA TRAER IMAGENES DE UN PRODUCTO===//

router.get("/:productoId", async (req, res) => {
  try {
    const productoId = Number(req.params.productoId);

    const [rows] = await baseDatos.query(
      `SELECT * FROM producto_imagenes 
       WHERE producto_id = ? 
       ORDER BY orden ASC`,
      [productoId]
    );

    res.json(rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al obtener imágenes",
    });
  }
});


//===ENDPOINT PARA ELIMINAR UNA IMAGEN===//

router.delete("/:imagenId", middleVerificador, async (req, res) => {
  try {
    const imagenId = Number(req.params.imagenId);

    if (isNaN(imagenId)) {
      return res.status(400).json({
        mensaje: "ID de imagen inválido",
      });
    }

    const [rows] = await baseDatos.query(
      "SELECT * FROM producto_imagenes WHERE id = ?",
      [imagenId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        mensaje: "Imagen no encontrada",
      });
    }

    // Obtener publicId de Cloudinary
    const imagen = rows[0];

    const posicion = imagen.imagen_url.indexOf("upload/") + 7;
    const resto = imagen.imagen_url.slice(posicion);

    const partes = resto.split("/");
    partes.shift();

    const publicId = partes.join("/").split(".")[0];

    // Eliminar de Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Eliminar de MySQL
    await baseDatos.query(
      "DELETE FROM producto_imagenes WHERE id = ?",
      [imagenId]
    );

    res.json({
      mensaje: "Imagen eliminada correctamente",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al eliminar la imagen",
    });
  }
});


//===ENDPOINT PARA SELECCIONAR IMAGEN PRINCIPAL===//

router.patch("/:imagenId", middleVerificador, async (req, res) => {
  try {
    const imagenId = Number(req.params.imagenId);

    if (isNaN(imagenId)) {
      return res.status(400).json({
        mensaje: "ID de imagen inválido",
      });
    }

    const [row] = await baseDatos.query(
      "SELECT * FROM producto_imagenes WHERE id = ?",
      [imagenId]
    );

    if (row.length === 0) {
      return res.status(404).json({
        mensaje: "Imagen no encontrada en la base de datos",
      });
    }

    const productoId = row[0].producto_id;

    // Resetear orden de imágenes
    await baseDatos.query(
      "UPDATE producto_imagenes SET orden = 1 WHERE producto_id = ?",
      [productoId]
    );

    // Poner imagen principal
    await baseDatos.query(
      "UPDATE producto_imagenes SET orden = 0 WHERE id = ?",
      [imagenId]
    );

    res.json({
      mensaje: "Imagen principal actualizada correctamente",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al poner como favorita la imagen",
    });
  }
});

module.exports = router;