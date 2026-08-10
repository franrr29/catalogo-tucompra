import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "../AuthContext";

const TIEMPO_INACTIVIDAD_MS = 15 * 60 * 1000;

// cierra la sesion del admin por inactividad dentro del dashboard
// que haya token valido para entrar ya lo controla RutaProtegida con el AuthContext
export function useAdminSession(navigate) {
  const timerRef = useRef(null);
  const { cerrarSesion } = useAuth();

  const cerrarYRedirigir = useCallback(async () => {
    await cerrarSesion();
    navigate("/admin/login");
  }, [cerrarSesion, navigate]);

  useEffect(() => {
    function reiniciarTimer() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(cerrarYRedirigir, TIEMPO_INACTIVIDAD_MS);
    }

    const eventos = ["click", "keydown", "mousemove"];
    eventos.forEach((evento) => window.addEventListener(evento, reiniciarTimer));
    reiniciarTimer();

    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, reiniciarTimer));
      clearTimeout(timerRef.current);
    };
  }, [cerrarYRedirigir]);

  return { cerrarSesion: cerrarYRedirigir };
}
