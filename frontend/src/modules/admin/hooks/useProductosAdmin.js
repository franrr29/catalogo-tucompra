import { useState, useEffect, useCallback, useRef } from "react";
import * as adminService from "../../../services/admin.service";

// maneja la lista de productos del panel y sus acciones de alta, baja y modificacion
// contrato de las acciones: si salen bien devuelven algo verdadero (el producto creado o true);
// si el backend responde 401 se cierra la sesion y devuelven null/false; cualquier otro error se lanza
export function useProductosAdmin(onUnauthorized) {
  const [productos, setProductos] = useState([]);

  // la lista sale del endpoint del panel (incluye el costo), que exige sesion: un 401 cierra la sesion.
  // onUnauthorized cambia en cada render del layout, asi que se lee desde un ref para que cargarProductos
  // siga siendo estable y el efecto de abajo no se repita
  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;

  const cargarProductos = useCallback(async () => {
    try {
      const data = await adminService.obtenerProductosAdmin();
      setProductos(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error.response?.status === 401) {
        onUnauthorizedRef.current();
        return;
      }
      console.error("error al traer productos");
    }
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const crearProducto = useCallback(async (datosProducto) => {
    try {
      const producto = await adminService.crearProducto(datosProducto);
      await cargarProductos();
      return producto;
    } catch (error) {
      if (error.response?.status === 401) {
        onUnauthorized();
        return null;
      }
      throw error;
    }
  }, [cargarProductos, onUnauthorized]);

  const actualizarProducto = useCallback(async (id, datosProducto) => {
    try {
      await adminService.actualizarProducto(id, datosProducto);
      await cargarProductos();
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        onUnauthorized();
        return false;
      }
      throw error;
    }
  }, [cargarProductos, onUnauthorized]);

  const borrarProducto = useCallback(async (id) => {
    try {
      await adminService.borrarProducto(id);
      setProductos((actuales) => actuales.filter((item) => item.id !== id));
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        onUnauthorized();
        return false;
      }
      throw error;
    }
  }, [onUnauthorized]);

  return { productos, cargarProductos, crearProducto, actualizarProducto, borrarProducto };
}
