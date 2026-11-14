import { useState, useEffect, useRef, useCallback } from "react";
import * as adminService from "../../../services/admin.service";

export const PERIODOS = [
  ["mes", "Este mes"],
  ["30dias", "Últimos 30 días"],
  ["todo", "Todo"],
];

export const ORDENES = [
  ["unidades", "Unidades"],
  ["ingresos", "Ingresos"],
];

export const PERIODO_INICIAL = "mes";
export const ORDEN_INICIAL = "unidades";

function mensajeDe(error, mensajePorDefecto) {
  return error.response?.data?.mensaje || mensajePorDefecto;
}

// pide un reporte y lo vuelve a pedir cuando cambia la clave (periodo, orden) o se reintenta.
// una respuesta que llega despues de un cambio de filtro se descarta; mientras carga no se muestran datos de otro filtro
function useReporte(cargar, clave, alExpirar, mensajeDeError) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: null });
  const [recarga, setRecarga] = useState(0);

  // cargar es una funcion nueva en cada render: se lee desde un ref para que solo la clave dispare el efecto
  const cargarRef = useRef(cargar);
  cargarRef.current = cargar;

  useEffect(() => {
    let vigente = true;
    setEstado({ datos: null, cargando: true, error: null });

    cargarRef
      .current()
      .then((datos) => {
        if (vigente) setEstado({ datos, cargando: false, error: null });
      })
      .catch((error) => {
        if (!vigente) return;
        if (error.response?.status === 401) {
          // la sesion se cierra y no se muestra un error
          setEstado({ datos: null, cargando: false, error: null });
          alExpirar();
          return;
        }
        setEstado({ datos: null, cargando: false, error: mensajeDe(error, mensajeDeError) });
      });

    return () => {
      vigente = false;
    };
  }, [clave, recarga, alExpirar, mensajeDeError]);

  const reintentar = useCallback(() => setRecarga((n) => n + 1), []);
  return { ...estado, reintentar };
}

// maneja los tres reportes del panel (rentabilidad, mas vendidos y ventas por departamento) para un periodo
// con un 401 se cierra la sesion (onUnauthorized) UNA sola vez, aunque fallen los tres pedidos a la vez;
// cualquier otro error se muestra en la seccion afectada con un boton para reintentar
export function useReportesAdmin(onUnauthorized) {
  const [periodo, setPeriodo] = useState(PERIODO_INICIAL);
  const [orden, setOrden] = useState(ORDEN_INICIAL);

  // onUnauthorized cambia en cada render del layout: se guarda en una referencia
  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;

  const sesionCerrada = useRef(false);
  const alExpirar = useCallback(() => {
    if (sesionCerrada.current) return;
    sesionCerrada.current = true;
    onUnauthorizedRef.current();
  }, []);

  const margen = useReporte(
    () => adminService.obtenerMargen({ periodo }),
    periodo,
    alExpirar,
    "No se pudo cargar la rentabilidad."
  );
  const masVendidos = useReporte(
    () => adminService.obtenerMasVendidos({ periodo, orden }),
    `${periodo}|${orden}`,
    alExpirar,
    "No se pudo cargar el ranking de más vendidos."
  );
  const departamentos = useReporte(
    () => adminService.obtenerVentasPorDepartamento({ periodo }),
    periodo,
    alExpirar,
    "No se pudieron cargar las ventas por departamento."
  );

  return {
    periodo,
    cambiarPeriodo: setPeriodo,
    orden,
    cambiarOrden: setOrden,
    margen,
    masVendidos,
    departamentos,
  };
}
