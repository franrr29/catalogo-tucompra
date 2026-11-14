import { useState } from "react";
import { useEnviosAdmin } from "./hooks/useEnviosAdmin";
import { formatearFecha } from "./formato";

const FILTROS = [
  ["por_despachar", "Por despachar"],
  ["enviado", "Enviados"],
  ["entregado", "Entregados"],
];

const ETIQUETA_ESTADO = { por_despachar: "Por despachar", enviado: "Enviado", entregado: "Entregado" };

const CLASE_ESTADO = {
  por_despachar: "bg-amber-100 text-amber-800 border-amber-200",
  enviado: "bg-blue-100 text-blue-800 border-blue-200",
  entregado: "bg-green-100 text-green-800 border-green-200",
};

const ENTREGA_COMPLETA = { domicilio: "Envío a domicilio", agencia: "Retiro en agencia" };
const ENTREGA_CORTA = { domicilio: "Domicilio", agencia: "Agencia" };

// el estado siguiente y el anterior de cada uno (un paso a la vez, como lo exige el backend)
const SIGUIENTE = { por_despachar: "enviado", enviado: "entregado" };
const ANTERIOR = { enviado: "por_despachar", entregado: "enviado" };

// texto del boton segun la direccion del cambio: avanzar es "Marcar como ...", retroceder es "Volver a ..."
function textoAccion(actual, destino) {
  const nombre = ETIQUETA_ESTADO[destino].toLowerCase();
  return SIGUIENTE[actual] === destino ? `Marcar como ${nombre}` : `Volver a ${nombre}`;
}

const claseBoton = "text-xs font-sans uppercase tracking-wider border border-border rounded px-4 py-2 transition-colors";
const claseBotonPrimario = "text-xs font-sans uppercase tracking-wider rounded px-4 py-2 transition-colors bg-[#111111] text-paper border border-[#111111] hover:bg-brand hover:border-brand disabled:opacity-50 disabled:cursor-not-allowed";
const MAX_SEGUIMIENTO = 60;

function Estado({ estado }) {
  return (
    <span className={`inline-block text-[10px] uppercase tracking-wider border rounded px-2 py-0.5 ${CLASE_ESTADO[estado] || ""}`}>
      {ETIQUETA_ESTADO[estado] || estado}
    </span>
  );
}

// una fila etiqueta / valor del detalle
function Dato({ etiqueta, children }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <dt className="text-[10px] text-muted-light uppercase tracking-wider">{etiqueta}</dt>
      <dd className="text-xs text-ink break-words">{children}</dd>
    </div>
  );
}

// datos para despachar el pedido y las acciones para cambiar su estado
function DetalleEnvio({ detalle, guardando, errorGuardar, onGuardar }) {
  const { envio, cliente } = detalle;
  const guardado = envio.nroSeguimiento || "";
  const [seguimiento, setSeguimiento] = useState(guardado);
  // el estado al que se quiere pasar, esperando la confirmacion
  const [pendiente, setPendiente] = useState(null);

  const cambioSeguimiento = seguimiento.trim() !== guardado;

  function datosAGuardar(estadoEnvio) {
    // solo se manda el seguimiento si cambio: vacio lo borra
    return cambioSeguimiento ? { estadoEnvio, nroSeguimiento: seguimiento.trim() } : { estadoEnvio };
  }

  async function confirmar() {
    const guardadoOk = await onGuardar(
      datosAGuardar(pendiente),
      `Pedido #${detalle.id}: ${ETIQUETA_ESTADO[pendiente].toLowerCase()}.`
    );
    if (!guardadoOk) setPendiente(null);
  }

  function guardarSeguimiento() {
    onGuardar(datosAGuardar(envio.estadoEnvio), `Pedido #${detalle.id}: seguimiento guardado.`);
  }

  const acciones = [SIGUIENTE[envio.estadoEnvio], ANTERIOR[envio.estadoEnvio]].filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Dato etiqueta="Pedido">#{detalle.id}</Dato>
        <Dato etiqueta="Estado del envío"><Estado estado={envio.estadoEnvio} /></Dato>
        <Dato etiqueta="Enviado el">{envio.enviadoEn ? formatearFecha(envio.enviadoEn) : "Todavía no"}</Dato>
      </dl>

      <section aria-label="Destinatario" className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink">Destinatario</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Dato etiqueta="Recibe">{cliente.nombre}</Dato>
          <Dato etiqueta="Teléfono">{cliente.telefono}</Dato>
          <Dato etiqueta="Tipo de entrega">{ENTREGA_COMPLETA[envio.tipoEntrega] || envio.tipoEntrega}</Dato>
          <Dato etiqueta="Departamento">{envio.departamento}</Dato>
          <Dato etiqueta="Ciudad / localidad">{envio.ciudad}</Dato>
          {envio.tipoEntrega === "domicilio" ? (
            <Dato etiqueta="Dirección">{envio.direccion}</Dato>
          ) : (
            <Dato etiqueta="Agencia o sucursal">{envio.agencia}</Dato>
          )}
        </dl>
        <dl>
          <Dato etiqueta="Comentario">
            <span className="whitespace-pre-wrap">{envio.comentario || "Sin comentario"}</span>
          </Dato>
        </dl>
      </section>

      <section aria-label="Actualizar envío" className="flex flex-col gap-3 border-t border-border pt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink">Actualizar envío</h3>

        <div className="flex flex-col gap-1.5 max-w-sm">
          <label htmlFor={`seguimiento-${detalle.id}`} className="text-[10px] text-muted-light uppercase tracking-wider">
            Número de seguimiento (opcional)
          </label>
          <input
            id={`seguimiento-${detalle.id}`}
            type="text"
            value={seguimiento}
            maxLength={MAX_SEGUIMIENTO}
            onChange={(e) => setSeguimiento(e.target.value)}
            disabled={guardando}
            className="bg-transparent border border-border text-ink text-xs px-4 py-3 focus:outline-none focus:border-[#111111] transition-all placeholder-[#999999] w-full font-sans rounded"
          />
        </div>

        {errorGuardar && (
          <p role="alert" className="text-xs text-red-600">{errorGuardar}</p>
        )}

        {pendiente ? (
          <div role="group" aria-label="Confirmar cambio" className="flex flex-col gap-3 border border-border rounded p-4 bg-white/60">
            <p className="text-xs text-ink">
              ¿Confirmás que el pedido #{detalle.id} pasa a <strong>{ETIQUETA_ESTADO[pendiente].toLowerCase()}</strong>?
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={confirmar} disabled={guardando} className={claseBotonPrimario}>
                {guardando ? "Guardando..." : "Confirmar"}
              </button>
              <button
                type="button"
                onClick={() => setPendiente(null)}
                disabled={guardando}
                className={`${claseBoton} text-ink hover:border-[#111111] disabled:opacity-50`}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {acciones.map((estado) => (
              <button
                key={estado}
                type="button"
                onClick={() => setPendiente(estado)}
                disabled={guardando}
                className={estado === SIGUIENTE[envio.estadoEnvio] ? claseBotonPrimario : `${claseBoton} text-ink hover:border-[#111111] disabled:opacity-50`}
              >
                {textoAccion(envio.estadoEnvio, estado)}
              </button>
            ))}
            {cambioSeguimiento && (
              <button
                type="button"
                onClick={guardarSeguimiento}
                disabled={guardando}
                className={`${claseBoton} text-ink hover:border-[#111111] disabled:opacity-50`}
              >
                {guardando ? "Guardando..." : "Guardar solo el seguimiento"}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// seccion de envios del panel: pedidos pagados con datos de envio, filtrados por estado de envio
// onUnauthorized: se llama cuando el backend responde 401 y hay que cerrar la sesion
function Envios({ onUnauthorized }) {
  const {
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
  } = useEnviosAdmin(onUnauthorized);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filtrar por estado de envío" className="flex flex-wrap gap-2">
          {FILTROS.map(([valor, texto]) => (
            <button
              key={valor}
              type="button"
              onClick={() => cambiarFiltro(valor)}
              aria-pressed={estadoEnvio === valor}
              className={`${claseBoton} ${
                estadoEnvio === valor ? "bg-[#111111] text-paper border-[#111111]" : "text-ink hover:border-[#111111]"
              }`}
            >
              {texto}
            </button>
          ))}
        </div>
        {listado && !cargando && !error && (
          <span className="text-[11px] text-muted uppercase tracking-wider">
            {listado.total} {listado.total === 1 ? "envío" : "envíos"}
          </span>
        )}
      </div>

      {aviso && (
        <p role="status" className="text-xs text-green-800 bg-green-100 border border-green-200 rounded px-4 py-3">
          {aviso}
        </p>
      )}

      {cargando && (
        <p role="status" className="text-xs text-muted py-6 text-center">
          Cargando envíos...
        </p>
      )}

      {!cargando && error && (
        <div role="alert" className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-xs text-red-600">{error}</p>
          <button type="button" onClick={reintentar} className={`${claseBoton} text-ink hover:border-[#111111]`}>
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && listado && listado.pedidos.length === 0 && (
        <p className="text-xs text-muted py-6 text-center">
          No hay envíos {estadoEnvio === "por_despachar" ? "por despachar" : `en estado "${ETIQUETA_ESTADO[estadoEnvio].toLowerCase()}"`}.
        </p>
      )}

      {!cargando && !error && listado && listado.pedidos.length > 0 && (
        <>
          <div
            aria-hidden="true"
            className="hidden sm:grid grid-cols-[7.5rem_1fr_1fr_6rem_6.5rem] gap-x-3 px-4 text-[10px] text-muted-light uppercase tracking-wider"
          >
            <span>Fecha</span>
            <span>Recibe</span>
            <span>Destino</span>
            <span>Entrega</span>
            <span>Estado</span>
          </div>

          <ul className="flex flex-col gap-2">
            {listado.pedidos.map((pedido) => {
              const abierto = idAbierto === pedido.id;
              return (
                <li key={pedido.id} className="border border-border rounded bg-white/50">
                  <button
                    type="button"
                    onClick={() => alternarDetalle(pedido.id)}
                    aria-expanded={abierto}
                    aria-controls={`detalle-envio-${pedido.id}`}
                    className="w-full text-left grid grid-cols-2 sm:grid-cols-[7.5rem_1fr_1fr_6rem_6.5rem] gap-x-3 gap-y-1 items-center px-4 py-3 text-xs hover:bg-white/70 transition-colors"
                  >
                    <span className="text-muted">{formatearFecha(pedido.fecha)}</span>
                    <span className="font-semibold truncate">{pedido.nombre}</span>
                    <span className="truncate">{[pedido.departamento, pedido.ciudad].filter(Boolean).join(" · ") || "—"}</span>
                    <span className="text-muted">{ENTREGA_CORTA[pedido.tipoEntrega] || "—"}</span>
                    <span><Estado estado={pedido.estadoEnvio} /></span>
                  </button>

                  {abierto && (
                    <div id={`detalle-envio-${pedido.id}`} className="border-t border-border px-4 py-4">
                      {cargandoDetalle && <p role="status" className="text-xs text-muted">Cargando detalle...</p>}
                      {!cargandoDetalle && errorDetalle && (
                        <div role="alert" className="flex flex-col items-start gap-3">
                          <p className="text-xs text-red-600">{errorDetalle}</p>
                          <button type="button" onClick={reintentarDetalle} className={`${claseBoton} text-ink hover:border-[#111111]`}>
                            Reintentar
                          </button>
                        </div>
                      )}
                      {!cargandoDetalle && !errorDetalle && detalle && detalle.envio && (
                        <DetalleEnvio
                          key={detalle.id}
                          detalle={detalle}
                          guardando={guardando}
                          errorGuardar={errorGuardar}
                          onGuardar={(datos, mensajeOk) => guardarEnvio(detalle.id, datos, mensajeOk)}
                        />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {listado.totalPaginas > 1 && (
            <nav aria-label="Paginación" className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => cambiarPagina(pagina - 1)}
                disabled={pagina <= 1}
                className={`${claseBoton} text-ink hover:border-[#111111] disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                Anterior
              </button>
              <span className="text-[11px] text-muted uppercase tracking-wider">
                Página {pagina} de {listado.totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => cambiarPagina(pagina + 1)}
                disabled={pagina >= listado.totalPaginas}
                className={`${claseBoton} text-ink hover:border-[#111111] disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default Envios;
