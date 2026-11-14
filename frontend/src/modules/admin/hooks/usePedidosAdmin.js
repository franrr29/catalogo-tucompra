import { useState, useEffect, useRef, useCallback } from "react";
import * as adminService from "../../../services/admin.service";

// por defecto el panel muestra las ventas ya pagadas
export const ESTADO_INICIAL = "pagado";

function mensajeDe(error, mensajePorDefecto) {
  return error.response?.data?.mensaje || mensajePorDefecto;
}

// maneja el listado de pedidos del panel (filtro por estado y pagina) y el detalle de un pedido abierto
// con un 401 se cierra la sesion (onUnauthorized) y no se muestra un error; cualquier otro error se muestra en pantalla
export function usePedidosAdmin(onUnauthorized) {
  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const [pagina, setPagina] = useState(1);
  const [listado, setListado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  // cada vez que se suma uno, el listado se vuelve a pedir (boton reintentar)
  const [recarga, setRecarga] = useState(0);

  const [idAbierto, setIdAbierto] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(null);

  // onUnauthorized cambia en cada render del Dashboard: se guarda en una referencia para que no dispare los efectos
  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;

  // numero de la ultima consulta de detalle, para descartar respuestas de pedidos que ya se cerraron
  const consultaDetalle = useRef(0);

  useEffect(() => {
    // si el filtro o la pagina cambian antes de que llegue la respuesta, esa respuesta se descarta
    let vigente = true;
    setCargando(true);
    setError(null);

    adminService
      .listarPedidos({ estado, pagina })
      .then((datos) => {
        if (!vigente) return;
        setListado(datos);
        setCargando(false);
      })
      .catch((err) => {
        if (!vigente) return;
        setCargando(false);
        if (err.response?.status === 401) {
          onUnauthorizedRef.current();
          return;
        }
        setError(mensajeDe(err, "No se pudieron cargar los pedidos."));
      });

    return () => {
      vigente = false;
    };
  }, [estado, pagina, recarga]);

  // cambiar el filtro vuelve a la primera pagina y cierra el detalle abierto
  const cambiarEstado = useCallback((nuevoEstado) => {
    consultaDetalle.current += 1;
    setIdAbierto(null);
    setDetalle(null);
    setPagina(1);
    setEstado(nuevoEstado);
  }, []);

  const cambiarPagina = useCallback((nuevaPagina) => {
    consultaDetalle.current += 1;
    setIdAbierto(null);
    setDetalle(null);
    setPagina(nuevaPagina);
  }, []);

  const reintentar = useCallback(() => setRecarga((n) => n + 1), []);

  const cargarDetalle = useCallback(async (id) => {
    const consulta = ++consultaDetalle.current;
    setDetalle(null);
    setErrorDetalle(null);
    setCargandoDetalle(true);

    try {
      const datos = await adminService.obtenerPedido(id);
      if (consulta !== consultaDetalle.current) return;
      setDetalle(datos);
    } catch (err) {
      if (consulta !== consultaDetalle.current) return;
      if (err.response?.status === 401) {
        onUnauthorizedRef.current();
      } else {
        setErrorDetalle(mensajeDe(err, "No se pudo cargar el detalle del pedido."));
      }
    } finally {
      if (consulta === consultaDetalle.current) setCargandoDetalle(false);
    }
  }, []);

  // abre el detalle de un pedido; si ya estaba abierto, lo cierra
  const alternarDetalle = useCallback((id) => {
    if (idAbierto === id) {
      consultaDetalle.current += 1;
      setIdAbierto(null);
      setDetalle(null);
      setErrorDetalle(null);
      setCargandoDetalle(false);
      return;
    }
    setIdAbierto(id);
    cargarDetalle(id);
  }, [idAbierto, cargarDetalle]);

  const reintentarDetalle = useCallback(() => {
    if (idAbierto !== null) cargarDetalle(idAbierto);
  }, [idAbierto, cargarDetalle]);

  return {
    estado,
    pagina,
    listado,
    cargando,
    error,
    cambiarEstado,
    cambiarPagina,
    reintentar,
    idAbierto,
    detalle,
    cargandoDetalle,
    errorDetalle,
    alternarDetalle,
    reintentarDetalle,
  };
}
