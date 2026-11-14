import { useState, useEffect, useRef, useCallback } from "react";
import * as adminService from "../../../services/admin.service";

export const INTERVALO_MS = 45 * 1000;
export const BACKOFF_MAXIMO_MS = 5 * 60 * 1000;
export const CLAVE_ULTIMO_VISTO = "tucompra_admin_ultimo_pedido_visto";

// el ultimo id de pedido que el admin ya vio vive en localStorage; si no se puede leer (modo privado, datos bloqueados)
// el panel sigue andando y simplemente no recuerda lo visto
function leerUltimoVisto() {
  try {
    const guardado = window.localStorage.getItem(CLAVE_ULTIMO_VISTO);
    if (guardado === null) return null;
    const numero = Number(guardado);
    return Number.isSafeInteger(numero) && numero >= 0 ? numero : null;
  } catch {
    return null;
  }
}

function guardarUltimoVisto(id) {
  try {
    window.localStorage.setItem(CLAVE_ULTIMO_VISTO, String(id));
  } catch {
    // sin localStorage no se recuerda lo visto
  }
}

// consulta cada ~45 s las ventas nuevas (pagadas con envio) y cuantos envios faltan despachar, para la campanita y el menu
// - solo consulta con la pestaña visible (y al volver a verla), una peticion a la vez y con AbortController
// - ante un error espera cada vez mas (hasta 5 min) y vuelve al ritmo normal al primer exito
// - ante un 401 deja de consultar y llama a onUnauthorized
// el polling no cuenta como actividad del usuario: el timer de inactividad solo escucha click, tecla y mouse
export function useNuevasVentas(onUnauthorized) {
  const [cantidad, setCantidad] = useState(0);
  const [ultimos, setUltimos] = useState([]);
  const [porDespachar, setPorDespachar] = useState(0);

  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;

  // null = nunca se vio nada: la primera respuesta fija el punto de partida (ultimoId) sin avisar de pedidos viejos
  const vistoRef = useRef(leerUltimoVisto());
  const ultimoIdRef = useRef(0);

  useEffect(() => {
    let activo = true;
    let temporizador = null;
    let controlador = null;
    let enVuelo = false;
    let fallos = 0;
    // numero de la ultima consulta: una que se abortó no debe tocar el estado de la siguiente
    let consultaActual = 0;

    const pestanaVisible = () => document.visibilityState === "visible";

    function programar(ms) {
      clearTimeout(temporizador);
      if (activo) temporizador = setTimeout(consultar, ms);
    }

    async function consultar() {
      if (!activo || enVuelo || !pestanaVisible()) return;
      const consulta = ++consultaActual;
      enVuelo = true;
      controlador = new AbortController();
      const desdeUsado = vistoRef.current;

      try {
        const datos = await adminService.pedidosNuevos(
          desdeUsado === null ? {} : { desde: desdeUsado },
          controlador.signal
        );
        if (!activo || consulta !== consultaActual) return;

        fallos = 0;
        ultimoIdRef.current = datos.ultimoId;
        setPorDespachar(datos.porDespachar);

        if (vistoRef.current === null) {
          // primera vez: lo que ya existe cuenta como visto
          vistoRef.current = datos.ultimoId;
          guardarUltimoVisto(datos.ultimoId);
        } else if (vistoRef.current === desdeUsado) {
          // si el admin marco como vistas mientras viajaba la respuesta, esa respuesta esta vieja
          setCantidad(datos.cantidad);
          setUltimos(datos.ultimos);
        }
        programar(INTERVALO_MS);
      } catch (error) {
        // una consulta abortada (pestaña oculta o desmontaje) no es un error
        if (!activo || consulta !== consultaActual || controlador.signal.aborted) return;
        if (error.response?.status === 401) {
          activo = false;
          onUnauthorizedRef.current();
          return;
        }
        fallos += 1;
        programar(Math.min(INTERVALO_MS * 2 ** fallos, BACKOFF_MAXIMO_MS));
      } finally {
        if (consulta === consultaActual) enVuelo = false;
      }
    }

    function alCambiarVisibilidad() {
      if (pestanaVisible()) {
        // al volver se consulta enseguida
        clearTimeout(temporizador);
        consultar();
      } else {
        // oculta: no se consulta y se cancela lo que estuviera en camino
        clearTimeout(temporizador);
        if (enVuelo) {
          consultaActual += 1;
          controlador.abort();
          enVuelo = false;
        }
      }
    }

    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    consultar();

    return () => {
      activo = false;
      clearTimeout(temporizador);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      if (controlador) controlador.abort();
    };
  }, []);

  // da por vistas todas las ventas conocidas: la proxima consulta pide solo lo posterior
  const marcarComoVistas = useCallback(() => {
    vistoRef.current = ultimoIdRef.current;
    guardarUltimoVisto(ultimoIdRef.current);
    setCantidad(0);
    setUltimos([]);
  }, []);

  return { cantidad, ultimos, porDespachar, marcarComoVistas };
}
