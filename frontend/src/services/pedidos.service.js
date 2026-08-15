import api from "../shared/axiosClient";

export async function crearPago(datosPago) {
  const response = await api.post("/api/pedidos", datosPago);
  return response.data;
}
