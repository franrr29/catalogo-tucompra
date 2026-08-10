import { useEffect, useRef, useCallback } from "react";

const TIEMPO_INACTIVIDAD_MS = 15 * 60 * 1000;

// exige token para entrar al dashboard y cierra la sesion por inactividad
export function useAdminSession(navigate) {
  const timerRef = useRef(null);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/admin/login");
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    function reiniciarTimer() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(cerrarSesion, TIEMPO_INACTIVIDAD_MS);
    }

    const eventos = ["click", "keydown", "mousemove"];
    eventos.forEach((evento) => window.addEventListener(evento, reiniciarTimer));
    reiniciarTimer();

    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, reiniciarTimer));
      clearTimeout(timerRef.current);
    };
  }, [navigate, cerrarSesion]);

  return { cerrarSesion };
}
