import api from "../shared/axiosClient";

// trae todos los productos del catalogo
export async function obtenerProductos() {
  const { data } = await api.get("/api/productos");
  return data;
}

// trae un producto puntual junto con sus imagenes
export async function obtenerProducto(id) {
  const { data } = await api.get(`/api/productos/${id}`);
  return data;
}
