import { usePedidosAdmin } from "./hooks/usePedidosAdmin";

const FILTROS = [
  ["pagado", "Pagados"],
  ["pendiente", "Pendientes"],
  ["cancelado", "Cancelados"],
  ["todos", "Todos"],
];

const ETIQUETA_ESTADO = { pagado: "Pagado", pendiente: "Pendiente", cancelado: "Cancelado" };

const CLASE_ESTADO = {
  pagado: "bg-green-100 text-green-800 border-green-200",
  pendiente: "bg-amber-100 text-amber-800 border-amber-200",
  cancelado: "bg-red-100 text-red-700 border-red-200",
};

const ENTREGA_COMPLETA = { domicilio: "Envío a domicilio", agencia: "Retiro en agencia" };
const ENTREGA_CORTA = { domicilio: "Domicilio", agencia: "Agencia" };

const claseBoton = "text-xs font-sans uppercase tracking-wider border border-border rounded px-4 py-2 transition-colors";

function formatearFecha(fecha) {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatearMonto(valor) {
  return `$${Number(valor).toLocaleString("es-UY", { maximumFractionDigits: 2 })}`;
}

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

function DetallePedido({ detalle }) {
  const { envio } = detalle;

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Dato etiqueta="Pedido">#{detalle.id}</Dato>
        <Dato etiqueta="Estado"><Estado estado={detalle.estado} /></Dato>
        <Dato etiqueta="Id de Mercado Pago">{detalle.mercadopagoId || "Sin pago registrado"}</Dato>
      </dl>

      <section aria-label="Cliente" className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink">Cliente</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Dato etiqueta="Nombre">{detalle.cliente.nombre}</Dato>
          <Dato etiqueta="Email">{detalle.cliente.email}</Dato>
          <Dato etiqueta="Teléfono">{detalle.cliente.telefono}</Dato>
        </dl>
      </section>

      <section aria-label="Envío" className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink">Envío</h3>
        {envio ? (
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Dato etiqueta="Tipo de entrega">{ENTREGA_COMPLETA[envio.tipoEntrega] || envio.tipoEntrega}</Dato>
            <Dato etiqueta="Departamento">{envio.departamento}</Dato>
            <Dato etiqueta="Ciudad / localidad">{envio.ciudad}</Dato>
            {envio.tipoEntrega === "domicilio" ? (
              <Dato etiqueta="Dirección">{envio.direccion}</Dato>
            ) : (
              <Dato etiqueta="Agencia o sucursal">{envio.agencia}</Dato>
            )}
            <Dato etiqueta="Cédula">{envio.cedula || "No informada"}</Dato>
            <Dato etiqueta="Comentario">
              <span className="whitespace-pre-wrap">{envio.comentario || "Sin comentario"}</span>
            </Dato>
          </dl>
        ) : (
          <p className="text-xs text-muted">Pedido anterior a la función de envío: no tiene datos de envío.</p>
        )}
      </section>

      <section aria-label="Productos" className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink">Productos</h3>
        <ul className="flex flex-col gap-1.5">
          {detalle.items.map((item) => (
            <li key={`${item.productoId}-${item.precioUnitario}`} className="flex justify-between gap-3 text-xs">
              <span className="min-w-0 break-words">
                {item.nombre} <span className="text-muted-light">x{item.cantidad} · {formatearMonto(item.precioUnitario)} c/u</span>
              </span>
              <span className="font-semibold whitespace-nowrap">{formatearMonto(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-border pt-2 text-xs">
          <span className="uppercase tracking-wider text-muted-light">Total</span>
          <span className="font-semibold">{formatearMonto(detalle.total)}</span>
        </div>
      </section>
    </div>
  );
}

// seccion de ventas del panel: pedidos filtrados por estado, con el detalle desplegable de cada uno
// onUnauthorized: se llama cuando el backend responde 401 y hay que cerrar la sesion
function Ventas({ onUnauthorized }) {
  const {
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
  } = usePedidosAdmin(onUnauthorized);

  const nombreFiltro = (FILTROS.find(([valor]) => valor === estado) || [])[1] || "";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
          {FILTROS.map(([valor, texto]) => (
            <button
              key={valor}
              type="button"
              onClick={() => cambiarEstado(valor)}
              aria-pressed={estado === valor}
              className={`${claseBoton} ${
                estado === valor ? "bg-[#111111] text-paper border-[#111111]" : "text-ink hover:border-[#111111]"
              }`}
            >
              {texto}
            </button>
          ))}
        </div>
        {listado && !cargando && !error && (
          <span className="text-[11px] text-muted uppercase tracking-wider">
            {listado.total} {listado.total === 1 ? "pedido" : "pedidos"}
          </span>
        )}
      </div>

      {cargando && (
        <p role="status" className="text-xs text-muted py-6 text-center">
          Cargando pedidos...
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
          No hay pedidos {estado === "todos" ? "todavía" : `con estado "${ETIQUETA_ESTADO[estado].toLowerCase()}"`}.
        </p>
      )}

      {!cargando && !error && listado && listado.pedidos.length > 0 && (
        <>
          <div
            aria-hidden="true"
            className="hidden sm:grid grid-cols-[7.5rem_1fr_6rem_6rem_6rem] gap-x-3 px-4 text-[10px] text-muted-light uppercase tracking-wider"
          >
            <span>Fecha</span>
            <span>Cliente</span>
            <span>Total</span>
            <span>Estado</span>
            <span>Entrega</span>
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
                    aria-controls={`detalle-pedido-${pedido.id}`}
                    className="w-full text-left grid grid-cols-2 sm:grid-cols-[7.5rem_1fr_6rem_6rem_6rem] gap-x-3 gap-y-1 items-center px-4 py-3 text-xs hover:bg-white/70 transition-colors"
                  >
                    <span className="text-muted">{formatearFecha(pedido.fecha)}</span>
                    <span className="font-semibold truncate">{pedido.nombre}</span>
                    <span>{formatearMonto(pedido.total)}</span>
                    <span><Estado estado={pedido.estado} /></span>
                    <span className="text-muted">{ENTREGA_CORTA[pedido.tipoEntrega] || "—"}</span>
                  </button>

                  {abierto && (
                    <div id={`detalle-pedido-${pedido.id}`} className="border-t border-border px-4 py-4">
                      {cargandoDetalle && (
                        <p role="status" className="text-xs text-muted">Cargando detalle...</p>
                      )}
                      {!cargandoDetalle && errorDetalle && (
                        <div role="alert" className="flex flex-col items-start gap-3">
                          <p className="text-xs text-red-600">{errorDetalle}</p>
                          <button type="button" onClick={reintentarDetalle} className={`${claseBoton} text-ink hover:border-[#111111]`}>
                            Reintentar
                          </button>
                        </div>
                      )}
                      {!cargandoDetalle && !errorDetalle && detalle && <DetallePedido detalle={detalle} />}
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

      {/* el filtro activo se anuncia para lectores de pantalla */}
      <span className="sr-only" aria-live="polite">
        {!cargando && !error && listado ? `Mostrando pedidos: ${nombreFiltro}` : ""}
      </span>
    </div>
  );
}

export default Ventas;
