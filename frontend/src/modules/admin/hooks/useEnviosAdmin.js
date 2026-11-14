import { useState, useEffect, useRef, useCallback } from "react";
import * as adminService from "../../../services/admin.service";

// por defecto el panel de envios muestra lo que falta despachar
export const FILTRO_INICIAL = "por_despachar";

function mensajeDe(error, mensajePorDefecto) {
  return error.response?.data?.mensaje || mensajePorDefecto;
}

// maneja el listado de envios (filtro por estado de envio y pagina), el detalle de un pedido abierto y el cambio de estado
// con un 401 se cierra la sesion (onUnauthorized) y no se muestra un error; cualquier otro error se muestra en pantalla
export function useEnviosAdmin(onUnauthorized) {
  const [estadoEnvio, setEstadoEnvio] = useState(FILTRO_INICIAL);
  const [pagina, setPagina] = useState(1);
  const [listado, setListado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  // cada vez que se suma uno, el listado se vuelve a pedir (reintentar o despues de guardar)
  const [recarga, setRecarga] = useState(0);

  const [idAbierto, setIdAbierto] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(null);

  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);
  // confirmacion visible de lo ultimo que se guardo
  const [aviso, setAviso] = useState(null);

  // onUnauthorized cambia en cada render del layout: se guarda en una referencia para que no dispare los efectos
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
      .listarPedidos({ estadoEnvio, pagina })
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
        setError(mensajeDe(err, "No se pudieron cargar los envíos."));
      });

    return () => {
      vigente = false;
    };
  }, [estadoEnvio, pagina, recarga]);

  const cerrarDetalle = useCallback(() => {
    consultaDetalle.current += 1;
    setIdAbierto(null);
    setDetalle(null);
    setErrorDetalle(null);
    setCargandoDetalle(false);
    setErrorGuardar(null);
  }, []);

  // cambiar el filtro vuelve a la primera pagina y cierra el detalle abierto
  const cambiarFiltro = useCallback((nuevoFiltro) => {
    cerrarDetalle();
    setAviso(null);
    setPagina(1);
    setEstadoEnvio(nuevoFiltro);
  }, [cerrarDetalle]);

  const cambiarPagina = useCallback((nuevaPagina) => {
    cerrarDetalle();
    setPagina(nuevaPagina);
  }, [cerrarDetalle]);

  const reintentar = useCallback(() => setRecarga((n) => n + 1), []);

  const cargarDetalle = useCallback(async (id) => {
    const consulta = ++consultaDetalle.current;
    setDetalle(null);
    setErrorDetalle(null);
    setErrorGuardar(null);
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
      cerrarDetalle();
      return;
    }
    setIdAbierto(id);
    cargarDetalle(id);
  }, [idAbierto, cargarDetalle, cerrarDetalle]);

  const reintentarDetalle = useCallback(() => {
    if (idAbierto !== null) cargarDetalle(idAbierto);
  }, [idAbierto, cargarDetalle]);

  // guarda el nuevo estado de envio (y el seguimiento si se manda). devuelve true si salio bien.
  // al guardar, el pedido puede dejar de pertenecer al filtro actual: se cierra el detalle y se recarga el listado
  const guardarEnvio = useCallback(async (id, datos, mensajeOk) => {
    if (guardando) return false;
    setGuardando(true);
    setErrorGuardar(null);

    try {
      await adminService.actualizarEnvio(id, datos);
      cerrarDetalle();
      setAviso(mensajeOk);
      setRecarga((n) => n + 1);
      return true;
    } catch (err) {
      if (err.response?.status === 401) {
        onUnauthorizedRef.current();
      } else {
        setErrorGuardar(mensajeDe(err, "No se pudo actualizar el envío."));
      }
      return false;
    } finally {
      setGuardando(false);
    }
  }, [guardando, cerrarDetalle]);

  return {
    estadoEnvio,
    pagina,
    listado,
    cargando,
    error,
    cambiarFiltro,
    cambiarPagina,
    reintentar,
    idAbierto,
    detalle,
    cargandoDetalle,
    errorDetalle,
    alternarDetalle,
    reintentarDetalle,
    guardando,
    errorGuardar,
    aviso,
    guardarEnvio,
  };
}
