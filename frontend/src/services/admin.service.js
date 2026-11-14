import api from "../shared/axiosClient";

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

// lista los pedidos del panel: paginado y con filtro opcional por estado (pendiente, pagado, cancelado o todos)
// o por estado de envio (por_despachar, enviado o entregado), que no se combinan
export async function listarPedidos({ estado, estadoEnvio, pagina, limite } = {}) {
  const { data } = await api.get("/api/admin/pedidos", { params: { estado, estadoEnvio, pagina, limite } });
  return data;
}

// trae el detalle de un pedido: contacto, datos de envio, items y el id de mercado pago
export async function obtenerPedido(id) {
  const { data } = await api.get(`/api/admin/pedidos/${id}`);
  return data;
}

// cambia el estado de envio de un pedido pagado (un paso a la vez) y, si se manda, su numero de seguimiento
export async function actualizarEnvio(id, { estadoEnvio, nroSeguimiento }) {
  const { data } = await api.patch(`/api/admin/pedidos/${id}/envio`, { estadoEnvio, nroSeguimiento });
  return data;
}

// ventas pagadas con envio posteriores al id dado, mas cuantos envios faltan despachar (para la campanita)
// sin desde solo devuelve ultimoId; signal permite cancelar la consulta
export async function pedidosNuevos({ desde } = {}, signal) {
  const { data } = await api.get("/api/admin/pedidos/nuevos", { params: { desde }, signal });
  return data;
}

// trae los productos del panel con su costo: los mismos que la lista publica, solo para el admin
export async function obtenerProductosAdmin() {
  const { data } = await api.get("/api/admin/productos");
  return data;
}

// reportes de rentabilidad del panel: solo pedidos pagados y siempre agregados (sin datos de clientes)
// periodo: "mes" (este mes), "30dias" o "todo"
export async function obtenerMargen({ periodo } = {}) {
  const { data } = await api.get("/api/admin/reportes/margen", { params: { periodo } });
  return data;
}

// productos mas vendidos; orden: "unidades" o "ingresos"
export async function obtenerMasVendidos({ periodo, orden, limite } = {}) {
  const { data } = await api.get("/api/admin/reportes/mas-vendidos", { params: { periodo, orden, limite } });
  return data;
}

// pedidos e ingresos por departamento
export async function obtenerVentasPorDepartamento({ periodo } = {}) {
  const { data } = await api.get("/api/admin/reportes/departamentos", { params: { periodo } });
  return data;
}
