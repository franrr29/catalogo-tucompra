import { useState } from "react";
import { useEnviosAdmin } from "./hooks/useEnviosAdmin";
import { formatearFecha } from "./formato";
import Badge from "./ui/Badge";
import EmptyState from "./ui/EmptyState";
import CargandoEstado from "./ui/CargandoEstado";
import { aviso as claseAviso, boton, campo, etiqueta, filtro, fila } from "./ui/estilos";


const FILTROS = [
  ["por_despachar", "Por despachar"],
  ["enviado", "Enviados"],
  ["entregado", "Entregados"],
];

const ETIQUETA_ESTADO = { por_despachar: "Por despachar", enviado: "Enviado", entregado: "Entregado" };

const VARIANTE_ESTADO = { por_despachar: "aviso", enviado: "info", entregado: "exito" };

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

const claseBoton = boton.secundario;
const claseBotonPrimario = boton.primario;
const claseEtiqueta = etiqueta;
const MAX_SEGUIMIENTO = 60;

function Estado({ estado }) {
  return (
    <Badge variante={VARIANTE_ESTADO[estado]}>{ETIQUETA_ESTADO[estado] || estado}</Badge>
  );
}

// una fila etiqueta / valor del detalle
function Dato({ etiqueta, children }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <dt className={claseEtiqueta}>{etiqueta}</dt>
      <dd className="text-sm text-ink break-words">{children}</dd>
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
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Dato etiqueta="Pedido">#{detalle.id}</Dato>
        <Dato etiqueta="Estado del envío"><Estado estado={envio.estadoEnvio} /></Dato>
        <Dato etiqueta="Enviado el">{envio.enviadoEn ? formatearFecha(envio.enviadoEn) : "Todavía no"}</Dato>
      </dl>

      <section aria-label="Destinatario" className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-ink">Destinatario</h3>
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

      <section aria-label="Actualizar envío" className="flex flex-col gap-4 border-t border-linea pt-5">
        <h3 className="text-sm font-semibold text-ink">Actualizar envío</h3>

        <div className="flex flex-col gap-1.5 max-w-sm">
          <label htmlFor={`seguimiento-${detalle.id}`} className={claseEtiqueta}>
            Número de seguimiento (opcional)
          </label>
          <input
            id={`seguimiento-${detalle.id}`}
            type="text"
            value={seguimiento}
            maxLength={MAX_SEGUIMIENTO}
            onChange={(e) => setSeguimiento(e.target.value)}
            disabled={guardando}
            className={campo}
          />
        </div>

        {errorGuardar && (
          <p role="alert" className={claseAviso.error}>{errorGuardar}</p>
        )}

        {pendiente ? (
          <div role="group" aria-label="Confirmar cambio" className="flex flex-col gap-4 border border-linea rounded-tarjeta p-5 bg-paper/60">
            <p className="text-sm text-ink">
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
                className={`${claseBoton}`}
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
                className={estado === SIGUIENTE[envio.estadoEnvio] ? claseBotonPrimario : `${claseBoton}`}
              >
                {textoAccion(envio.estadoEnvio, estado)}
              </button>
            ))}
            {cambioSeguimiento && (
              <button
                type="button"
                onClick={guardarSeguimiento}
                disabled={guardando}
                className={`${claseBoton}`}
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filtrar por estado de envío" className="flex flex-wrap gap-2">
          {FILTROS.map(([valor, texto]) => (
            <button
              key={valor}
              type="button"
              onClick={() => cambiarFiltro(valor)}
              aria-pressed={estadoEnvio === valor}
              className={estadoEnvio === valor ? filtro.activo : filtro.inactivo}
            >
              {texto}
            </button>
          ))}
        </div>
        {listado && !cargando && !error && (
          <span className="text-xs font-semibold text-muted">
            {listado.total} {listado.total === 1 ? "envío" : "envíos"}
          </span>
        )}
      </div>

      {aviso && (
        <p role="status" className={claseAviso.exito}>
          {aviso}
        </p>
      )}

      {cargando && (
        <CargandoEstado texto="Cargando envíos..." />
      )}

      {!cargando && error && (
        <EmptyState tono="error" role="alert" titulo={error}>
          <button type="button" onClick={reintentar} className={claseBoton}>
            Reintentar
          </button>
        </EmptyState>
      )}

      {!cargando && !error && listado && listado.pedidos.length === 0 && (
        <EmptyState
          titulo={`No hay envíos ${estadoEnvio === "por_despachar" ? "por despachar" : `en estado "${ETIQUETA_ESTADO[estadoEnvio].toLowerCase()}"`}.`}
        />
      )}

      {!cargando && !error && listado && listado.pedidos.length > 0 && (
        <>
          <div
            aria-hidden="true"
            className={`${fila.encabezado} grid-cols-[7.5rem_1fr_1fr_6rem_6.5rem] gap-x-3`}
          >
            <span>Fecha</span>
            <span>Recibe</span>
            <span>Destino</span>
            <span>Entrega</span>
            <span>Estado</span>
          </div>

          <ul className="flex flex-col gap-3">
            {listado.pedidos.map((pedido) => {
              const abierto = idAbierto === pedido.id;
              return (
                <li key={pedido.id} className={fila.contenedor}>
                  <button
                    type="button"
                    onClick={() => alternarDetalle(pedido.id)}
                    aria-expanded={abierto}
                    aria-controls={`detalle-envio-${pedido.id}`}
                    className={`${fila.boton} grid grid-cols-2 sm:grid-cols-[7.5rem_1fr_1fr_6rem_6.5rem] gap-x-3 gap-y-1 items-center`}
                  >
                    <span className="text-muted">{formatearFecha(pedido.fecha)}</span>
                    <span className="font-semibold truncate">{pedido.nombre}</span>
                    <span className="truncate">{[pedido.departamento, pedido.ciudad].filter(Boolean).join(" · ") || "—"}</span>
                    <span className="text-muted">{ENTREGA_CORTA[pedido.tipoEntrega] || "—"}</span>
                    <span><Estado estado={pedido.estadoEnvio} /></span>
                  </button>

                  {abierto && (
                    <div id={`detalle-envio-${pedido.id}`} className={fila.detalle}>
                      {cargandoDetalle && <p role="status" className="text-sm text-muted">Cargando detalle...</p>}
                      {!cargandoDetalle && errorDetalle && (
                        <div role="alert" className="flex flex-col items-start gap-3">
                          <p className="text-sm text-red-700">{errorDetalle}</p>
                          <button type="button" onClick={reintentarDetalle} className={`${claseBoton}`}>
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
                className={`${claseBoton}`}
              >
                Anterior
              </button>
              <span className="text-xs font-semibold text-muted">
                Página {pagina} de {listado.totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => cambiarPagina(pagina + 1)}
                disabled={pagina >= listado.totalPaginas}
                className={`${claseBoton}`}
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
