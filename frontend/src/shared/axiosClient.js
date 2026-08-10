import axios from "axios";
import { API_URL } from "../config";

// instancia central de axios que usan todos los services de la app
// withCredentials hace que el navegador mande la cookie httpOnly en cada peticion
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default api;
