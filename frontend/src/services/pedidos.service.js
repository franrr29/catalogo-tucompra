import api from "../shared/axiosClient";

export async function crearPago(datosPago) {
  const response = await api.post("/api/pedidos", datosPago);
  return response.data;
}

// consulta solo el estado de un pedido: "pendiente", "pagado" o "cancelado"
export async function obtenerEstadoPedido(id) {
  const response = await api.get(`/api/pedidos/${id}`);
  return response.data.estado;
}
