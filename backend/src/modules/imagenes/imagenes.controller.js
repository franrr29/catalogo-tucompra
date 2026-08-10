const { upload } = require("../../config/cloudinary");
const {
  subirImagenes,
  obtenerImagenesDeProducto,
  eliminarImagen,
  marcarImagenPrincipal,
} = require("./imagenes.service");

// middleware de multer para recibir hasta 10 imagenes en el campo imagenes
const subirMiddleware = (req, res, next) => {
  upload.fields([{ name: "imagenes", maxCount: 10 }])(req, res, (err) => {
    if (err) {
      console.log("error multer/cloudinary:");
      console.dir(err, { depth: null });
      return res.status(500).json({ mensaje: err.message || "error upload" });
    }
    next();
  });
};

async function subirImagenesProducto(req, res) {
  try {
    const productoId = Number(req.params.productoId);
    const archivos = req.files?.imagenes;

    const imagenes = await subirImagenes(productoId, archivos);

    res.json({
      mensaje: "imagenes subidas correctamente",
      imagenes,
    });
  } catch (error) {
    console.log("error completo:");
    console.dir(error, { depth: null });
    res.status(error.status || 500).json({ mensaje: error.message || "error interno" });
  }
}

async function listarImagenesProducto(req, res) {
  try {
    const productoId = Number(req.params.productoId);
    const imagenes = await obtenerImagenesDeProducto(productoId);
    res.json(imagenes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "error al obtener imagenes" });
  }
}

async function borrarImagen(req, res) {
  try {
    const imagenId = Number(req.params.imagenId);
    await eliminarImagen(imagenId);
    res.json({ mensaje: "imagen eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ mensaje: error.message || "error al eliminar la imagen" });
  }
}

async function elegirImagenPrincipal(req, res) {
  try {
    const imagenId = Number(req.params.imagenId);
    await marcarImagenPrincipal(imagenId);
    res.json({ mensaje: "imagen principal actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ mensaje: error.message || "error al poner como favorita la imagen" });
  }
}

module.exports = {
  subirMiddleware,
  subirImagenesProducto,
  listarImagenesProducto,
  borrarImagen,
  elegirImagenPrincipal,
};
