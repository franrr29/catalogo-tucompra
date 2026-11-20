// fragmentos SQL compartidos entre el listado de productos y el carrito

// columnas que ve el publico: se listan una por una (nunca p.*) para que productos.costo no salga por la tienda
const COLUMNAS_PUBLICAS = "p.id, p.nombre, p.descripcion, p.precio, p.stock, p.categoria, p.activo, p.creado_en";

// une cada producto con su imagen principal (orden 0) como imagen_url
const UNION_IMAGEN_PRINCIPAL = `
    LEFT JOIN (
      SELECT producto_id, imagen_url
      FROM producto_imagenes
      WHERE orden = 0
    ) i ON p.id = i.producto_id`;

module.exports = { COLUMNAS_PUBLICAS, UNION_IMAGEN_PRINCIPAL };
