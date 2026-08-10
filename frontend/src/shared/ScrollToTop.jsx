import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// recuerda la posicion del scroll de cada pagina y la restaura al volver atras
function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const guardarPosicion = () => {
      sessionStorage.setItem(`scroll:${pathname}`, String(window.scrollY));
    };

    if (navigationType === "POP") {
      const guardada = sessionStorage.getItem(`scroll:${pathname}`);
      if (guardada !== null) {
        const y = Number(guardada);
        window.scrollTo(0, y);
        const reintento = setTimeout(() => window.scrollTo(0, y), 250);
        window.addEventListener("beforeunload", guardarPosicion);
        return () => {
          clearTimeout(reintento);
          guardarPosicion();
          window.removeEventListener("beforeunload", guardarPosicion);
        };
      }
    }

    window.scrollTo(0, 0);
    window.addEventListener("beforeunload", guardarPosicion);
    return () => {
      guardarPosicion();
      window.removeEventListener("beforeunload", guardarPosicion);
    };
  }, [pathname, navigationType]);

  return null;
}

export default ScrollToTop;
