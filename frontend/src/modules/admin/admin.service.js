import api from "../../shared/axiosClient";

// inicia sesion de administrador, el backend guarda el token en una cookie httpOnly
export async function login(user, password) {
  await api.post("/api/login/login", { user, password });
}

// cierra la sesion, el backend borra la cookie
export async function logout() {
  await api.post("/api/login/logout");
}

// pregunta al backend si la cookie del token sigue siendo valida
export async function verificarSesion() {
  await api.get("/api/login/me");
}

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

// crea un producto nuevo
export async function crearProducto(datosProducto) {
  const { data } = await api.post("/api/productos", datosProducto);
  return data;
}

// actualiza los datos de un producto existente
export async function actualizarProducto(id, datosProducto) {
  const { data } = await api.patch(`/api/productos/${id}`, datosProducto);
  return data;
}

// elimina un producto
export async function borrarProducto(id) {
  const { data } = await api.delete(`/api/productos/${id}`);
  return data;
}

// sube una o varias imagenes para un producto
export async function subirImagenes(productoId, formData) {
  const { data } = await api.post(`/api/imagenes/${productoId}`, formData);
  return data;
}

// marca una imagen como la principal del producto
export async function marcarImagenPrincipal(imagenId) {
  const { data } = await api.patch(`/api/imagenes/${imagenId}`);
  return data;
}

// elimina una imagen de un producto
export async function borrarImagen(imagenId) {
  const { data } = await api.delete(`/api/imagenes/${imagenId}`);
  return data;
}
