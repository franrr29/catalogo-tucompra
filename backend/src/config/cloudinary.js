// ===CONFIGURACION DE CLOUDINARY E IMPORTAR MULTER Y .ENV===//

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// CONFIGURACION DEL STORAGE: donde se guardan y en que formato
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "tu-compra-productos", // carpeta en Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }], // limita el tamaño sin distorsionar
  },
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };