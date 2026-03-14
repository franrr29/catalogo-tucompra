//===ENDPOINT PARA SUBIR IMAGENES, BORRAR, ETC DIRECTO A LA BASE DE DATOS Y CLOUDINARY===//

const { Router } = require("express");
const { upload, cloudinary } = require("../config/cloudinary");
const baseDatos = require("../config/db");

const router = Router();

// DEBUG TEMPORAL
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED:', reason);
});

// POST — sube imágenes para un producto
router.post("/:productoId", upload.fields([{ name: "imagenes", maxCount: 10 }]), async (req, res) => {
  try {
    const productoId = Number(req.params.productoId);

    if (isNaN(productoId)) {
      return res.status(400).json({ mensaje: "ID de producto inválido" });
    }

    const archivos = req.files?.imagenes;

    if (!archivos || archivos.length === 0) {
      return res.status(400).json({ mensaje: "No se enviaron imágenes" });
    }

    const inserts = archivos.map((file, index) =>
      baseDatos.query(
        "INSERT INTO producto_imagenes (producto_id, imagen_url, orden) VALUES (?, ?, ?)",
        [productoId, file.path, index]
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

// GET — trae todas las fotos de un producto
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

// DELETE — elimina una imagen por id
router.delete("/:imagenId", async (req, res) => {
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

    const imagen = rows[0];
    const urlParts = imagen.imagen_url.split("/");
    const publicId = "tu-compra-productos/" + urlParts[urlParts.length - 1].split(".")[0];

    await cloudinary.uploader.destroy(publicId);
    await baseDatos.query("DELETE FROM producto_imagenes WHERE id = ?", [imagenId]);

    res.json({ mensaje: "Imagen eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar la imagen" });
  }
});

module.exports = router;