import { useState, useEffect } from "react";
import * as adminService from "../../../services/admin.service";

// genera previsualizaciones locales de las fotos elegidas antes de subirlas y las sube
export function useFotosPendientes(activo, onUnauthorized) {
  const [fotosSeleccionadas, setFotosSeleccionadas] = useState(null);
  const [previewsPendientes, setPreviewsPendientes] = useState([]);

  useEffect(() => {
    if (!fotosSeleccionadas || !activo) {
      setPreviewsPendientes([]);
      return;
    }
    const urls = Array.from(fotosSeleccionadas).map((archivo) => URL.createObjectURL(archivo));
    setPreviewsPendientes(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [fotosSeleccionadas, activo]);

  function limpiar() {
    setFotosSeleccionadas(null);
  }

  // sube las fotos elegidas a un producto. devuelve true si salio bien o no habia fotos; false si el
  // backend respondio 401 (ya se cerro la sesion); cualquier otro error se lanza. siempre limpia la seleccion
  async function subir(productoId) {
    if (!fotosSeleccionadas) return true;

    const formData = new FormData();
    Array.from(fotosSeleccionadas).forEach((archivo) => formData.append("imagenes", archivo));

    try {
      await adminService.subirImagenes(productoId, formData);
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        onUnauthorized();
        return false;
      }
      throw error;
    } finally {
      limpiar();
    }
  }

  return { fotosSeleccionadas, setFotosSeleccionadas, previewsPendientes, limpiar, subir };
}
