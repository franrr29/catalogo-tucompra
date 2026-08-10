import { useState, useCallback } from "react";
import * as adminService from "../admin.service";

const FORM_VACIO = { nombre: "", precio: "", stock: "", imagen: "" };

// maneja el producto que se esta editando: sus datos, sus imagenes y el panel
export function useEdicionProducto(onUnauthorized) {
  const [idProductoEditado, setIdProductoEditado] = useState(null);
  const [actualizarDatos, setActualizarDatos] = useState(FORM_VACIO);
  const [imagenesEditor, setImagenesEditor] = useState([]);

  const abrirPanel = useCallback(async (id, productos) => {
    const numericId = Number(id);

    if (!numericId) {
      setIdProductoEditado(null);
      setImagenesEditor([]);
      setActualizarDatos(FORM_VACIO);
      return;
    }

    try {
      setIdProductoEditado(numericId);

      const productoSeleccionado = productos.find((p) => p.id === numericId);
      if (productoSeleccionado) {
        setActualizarDatos({
          nombre: productoSeleccionado.nombre || "",
          precio: productoSeleccionado.precio || "",
          stock: productoSeleccionado.stock || "",
          imagen: "",
        });
      }

      const data = await adminService.obtenerProducto(numericId);
      setImagenesEditor(data.imagenes || []);
    } catch (error) {
      if (error.response?.status === 401) {
        onUnauthorized();
        return;
      }
      console.error("error al cargar las imagenes del editor", error);
    }
  }, [onUnauthorized]);

  const cerrarPanel = useCallback(() => {
    setIdProductoEditado(null);
    setActualizarDatos(FORM_VACIO);
  }, []);

  const marcarPrincipal = useCallback(async (imagenId, productoId, productos) => {
    try {
      await adminService.marcarImagenPrincipal(imagenId);
      await abrirPanel(productoId, productos);
    } catch (error) {
      if (error.response?.status === 401) {
        onUnauthorized();
        return;
      }
      console.error("error al marcar portada", error);
    }
  }, [abrirPanel, onUnauthorized]);

  const borrarFoto = useCallback(async (imagenId) => {
    try {
      await adminService.borrarImagen(imagenId);
      setImagenesEditor((actuales) => actuales.filter((imagen) => imagen.id !== imagenId));
    } catch (error) {
      if (error.response?.status === 401) {
        onUnauthorized();
        return;
      }
      throw error;
    }
  }, [onUnauthorized]);

  return {
    idProductoEditado,
    actualizarDatos,
    setActualizarDatos,
    imagenesEditor,
    abrirPanel,
    cerrarPanel,
    marcarPrincipal,
    borrarFoto,
  };
}
