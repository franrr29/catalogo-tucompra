import { Link } from "react-router-dom";
import { useReportesAdmin, PERIODOS, ORDENES } from "./hooks/useReportesAdmin";
import { Card, CardTitle } from "./ui/Card";
import Badge from "./ui/Badge";
import EmptyState from "./ui/EmptyState";
import CargandoEstado from "./ui/CargandoEstado";
import BarrasHorizontales from "./ui/BarrasHorizontales";
import { boton, filtro } from "./ui/estilos";
import { formatearMonto, formatearPorcentaje } from "./formato";

// cuantos productos sin costo se nombran en el aviso; el resto se resume con "y N mas"
const MAX_SIN_COSTO_VISIBLES = 5;

const plural = (cantidad, singular, pluralTexto) => `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;

// una tarjeta de dato con su etiqueta, el valor grande y una nota corta
function Dato({ etiqueta, valor, nota }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-control border border-linea bg-paper/60 p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">{etiqueta}</dt>
      <dd className="flex flex-col gap-1">
        <span className="text-2xl font-bold tracking-tight text-ink">{valor}</span>
        <span className="text-xs text-muted">{nota}</span>
      </dd>
    </div>
  );
}

// estados comunes de cada seccion: cargando, error con reintento
function EstadoDeCarga({ reporte, textoCargando }) {
  if (reporte.cargando) return <CargandoEstado texto={textoCargando} />;
  if (reporte.error) {
    return (
      <EmptyState tono="error" role="alert" titulo={reporte.error}>
        <button type="button" onClick={reporte.reintentar} className={boton.secundario}>
          Reintentar
        </button>
      </EmptyState>
    );
  }
  return null;
}

// aviso de productos activos sin costo: sin costo no hay margen. enlaza al editor de cada producto
function AvisoSinCosto({ productos }) {
  if (productos.length === 0) return null;

  const visibles = productos.slice(0, MAX_SIN_COSTO_VISIBLES);
  const restantes = productos.length - visibles.length;

  return (
    <div className="flex flex-col gap-3 rounded-control border border-amber-200 bg-amber-100 p-4 text-amber-800">
      <p className="text-sm font-semibold">{plural(productos.length, "producto sin costo cargado", "productos sin costo cargado")}</p>
      <p className="text-sm">Sin costo no se puede calcular el margen. Cargalo desde Productos:</p>
      <ul className="flex flex-col gap-1.5 text-sm">
        {visibles.map((producto) => (
          <li key={producto.id}>
            <Link
              to={`/admin/productos?editar=${producto.id}`}
              className="font-semibold underline underline-offset-2 rounded hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-oro-acento"
            >
              {producto.nombre}
              <span className="sr-only">: cargar costo</span>
            </Link>
          </li>
        ))}
      </ul>
      {restantes > 0 && (
        <p className="text-sm">
          y {plural(restantes, "producto más", "productos más")}.{" "}
          <Link to="/admin/productos" className="font-semibold underline underline-offset-2 hover:text-ink">
            Ver Productos
          </Link>
        </p>
      )}
    </div>
  );
}

function SeccionRentabilidad({ reporte }) {
  const { datos } = reporte;

  return (
    <Card aria-labelledby="titulo-ingresos" className="flex flex-col gap-5">
      <CardTitle id="titulo-ingresos">Ingresos y ganancia</CardTitle>

      <EstadoDeCarga reporte={reporte} textoCargando="Cargando rentabilidad..." />

      {datos && (
        <>
          {datos.ingresosTotales === 0 ? (
            <EmptyState titulo="No hay ventas pagadas en este período." />
          ) : (
            <>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Dato etiqueta="Ingresos" valor={formatearMonto(datos.ingresosTotales)} nota="Ventas pagadas del período" />
                <Dato
                  etiqueta="Ganancia"
                  valor={datos.ingresosConCosto > 0 ? formatearMonto(datos.ganancia) : "Sin dato"}
                  nota="Ingresos menos costo, solo de productos con costo"
                />
                <Dato
                  etiqueta="Margen"
                  valor={datos.margenPct !== null ? formatearPorcentaje(datos.margenPct) : "Sin dato"}
                  nota={
                    datos.coberturaPct !== null
                      ? `Sobre el ${formatearPorcentaje(datos.coberturaPct)} de los ingresos que tiene costo`
                      : "Sin ventas con costo"
                  }
                />
              </dl>
              {datos.ingresosSinCosto > 0 && (
                <p className="text-sm text-muted">
                  {formatearMonto(datos.ingresosSinCosto)} de ingresos no tienen costo (ventas anteriores o productos
                  sin costo cargado) y no entran en la ganancia ni en el margen.
                </p>
              )}
            </>
          )}

          <AvisoSinCosto productos={datos.productosSinCosto} />

          <p className="text-xs text-muted">
            El margen no incluye la comisión de Mercado Pago ni el costo de envío. El período se calcula por la fecha
            en que se creó el pedido, no la del pago.
          </p>
        </>
      )}
    </Card>
  );
}

function SeccionMasVendidos({ reporte, orden, cambiarOrden }) {
  const { datos } = reporte;

  return (
    <Card aria-labelledby="titulo-mas-vendidos" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle id="titulo-mas-vendidos">Más vendidos</CardTitle>
        <div role="group" aria-label="Ordenar por" className="flex flex-wrap gap-2">
          {ORDENES.map(([valor, texto]) => (
            <button
              key={valor}
              type="button"
              onClick={() => cambiarOrden(valor)}
              aria-pressed={orden === valor}
              className={orden === valor ? filtro.activo : filtro.inactivo}
            >
              {texto}
            </button>
          ))}
        </div>
      </div>

      <EstadoDeCarga reporte={reporte} textoCargando="Cargando más vendidos..." />

      {datos && datos.productos.length === 0 && <EmptyState titulo="No hubo ventas pagadas en este período." />}

      {datos && datos.productos.length > 0 && (
        <ol className="flex flex-col divide-y divide-linea">
          {datos.productos.map((producto, indice) => (
            <li key={producto.productoId} className="flex items-center gap-4 py-3">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-paper"
              >
                {indice + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold text-ink">{producto.nombre}</span>
                {!producto.activo && <span className="text-xs text-muted">Dado de baja</span>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5 text-right text-sm">
                <span className="font-semibold text-ink">{plural(producto.unidades, "unidad", "unidades")}</span>
                <span className="text-muted">{formatearMonto(producto.ingresos)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function SeccionDepartamentos({ reporte }) {
  const { datos } = reporte;

  return (
    <Card aria-labelledby="titulo-departamentos" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <CardTitle id="titulo-departamentos">Ventas por departamento</CardTitle>
        <p className="text-xs text-muted">Solo pedidos pagados con datos de envío.</p>
      </div>

      <EstadoDeCarga reporte={reporte} textoCargando="Cargando ventas por departamento..." />

      {datos && datos.departamentos.length === 0 && <EmptyState titulo="No hay ventas con envío en este período." />}

      {datos && datos.departamentos.length > 0 && (
        <BarrasHorizontales
          ariaLabel="Ingresos por departamento"
          items={datos.departamentos.map((fila) => ({
            clave: fila.departamento,
            etiqueta: fila.departamento,
            valor: fila.ingresos,
            texto: `${formatearMonto(fila.ingresos)} · ${plural(fila.pedidos, "pedido", "pedidos")}`,
          }))}
        />
      )}
    </Card>
  );
}

// reportes del panel: rentabilidad, productos mas vendidos y ventas por departamento de un periodo
// onUnauthorized: se llama cuando el backend responde 401 y hay que cerrar la sesion
function Reportes({ onUnauthorized }) {
  const { periodo, cambiarPeriodo, orden, cambiarOrden, margen, masVendidos, departamentos } =
    useReportesAdmin(onUnauthorized);

  const nombrePeriodo = (PERIODOS.find(([valor]) => valor === periodo) || [])[1] || "";

  return (
    <div className="flex flex-col gap-8">
      <div role="group" aria-label="Período" className="flex flex-wrap items-center gap-2">
        {PERIODOS.map(([valor, texto]) => (
          <button
            key={valor}
            type="button"
            onClick={() => cambiarPeriodo(valor)}
            aria-pressed={periodo === valor}
            className={periodo === valor ? filtro.activo : filtro.inactivo}
          >
            {texto}
          </button>
        ))}
        <Badge variante="neutro" className="ml-auto hidden sm:inline-flex">
          Pedidos pagados
        </Badge>
      </div>

      <SeccionRentabilidad reporte={margen} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <SeccionMasVendidos reporte={masVendidos} orden={orden} cambiarOrden={cambiarOrden} />
        <SeccionDepartamentos reporte={departamentos} />
      </div>

      {/* el periodo activo se anuncia para lectores de pantalla */}
      <span className="sr-only" aria-live="polite">{`Mostrando: ${nombrePeriodo}`}</span>
    </div>
  );
}

export default Reportes;
