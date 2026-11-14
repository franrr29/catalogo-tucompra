import api from "../shared/axiosClient";

// trae todos los productos del catalogo
// con { fresco: true } (lo usa el panel de admin) el backend responde sin cache
export async function obtenerProductos({ fresco = false } = {}) {
  const { data } = await api.get("/api/productos", { params: fresco ? { fresh: 1 } : undefined });
  return data;
}

// trae un producto puntual junto con sus imagenes
export async function obtenerProducto(id, { fresco = false } = {}) {
  const { data } = await api.get(`/api/productos/${id}`, { params: fresco ? { fresh: 1 } : undefined });
  return data;
}
