import { useState, useEffect } from "react";

// genera previsualizaciones locales de las fotos elegidas antes de subirlas
export function useFotosPendientes(activo) {
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

  return { fotosSeleccionadas, setFotosSeleccionadas, previewsPendientes, limpiar };
}
