import api from "../../shared/axiosClient";

// agrega un producto al carrito y devuelve el producto actualizado
export async function agregarAlCarrito(productId) {
  const { data } = await api.post("/api/cart/add", { productId });
  return data;
}

// verifica contra la base de datos que los productos del carrito sigan existiendo
export async function verificarCarrito(productosIds) {
  const { data } = await api.post("/api/cart/verificar", { productosIds });
  return data;
}
