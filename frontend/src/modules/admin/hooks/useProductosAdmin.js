import { useState, useEffect, useCallback } from "react";
import * as adminService from "../admin.service";

// maneja la lista de productos del panel y sus acciones de alta, baja y modificacion
export function useProductosAdmin(onUnauthorized) {
  const [productos, setProductos] = useState([]);

  const cargarProductos = useCallback(async () => {
    try {
      const data = await adminService.obtenerProductos();
      setProductos(Array.isArray(data) ? data : []);
    } catch (error) {
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
    } catch (error) {
      if (error.response?.status === 401) {
        onUnauthorized();
        return;
      }
      throw error;
    }
  }, [cargarProductos, onUnauthorized]);

  const borrarProducto = useCallback(async (id) => {
    try {
      await adminService.borrarProducto(id);
      setProductos((actuales) => actuales.filter((item) => item.id !== id));
    } catch (error) {
      if (error.response?.status === 401) {
        onUnauthorized();
        return;
      }
      throw error;
    }
  }, [onUnauthorized]);

  return { productos, cargarProductos, crearProducto, actualizarProducto, borrarProducto };
}
