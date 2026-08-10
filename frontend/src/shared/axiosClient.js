import axios from "axios";
import { API_URL } from "../config";

// instancia central de axios que usan todos los services de la app
const api = axios.create({
  baseURL: API_URL,
});

// agrega el token guardado en el navegador a cada peticion, si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
