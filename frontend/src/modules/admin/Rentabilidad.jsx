import { Card, CardTitle } from "./ui/Card";
import Badge from "./ui/Badge";
import EmptyState from "./ui/EmptyState";
import { boton } from "./ui/estilos";
import { formatearMonto, formatearPorcentaje } from "./formato";
import { aNumero, calcularMargen } from "./costos";

// celda de margen: ganancia por unidad y porcentaje; "Sin dato" si falta el costo (no se asume 0).
// una perdida se marca tambien con texto, no solo con color
function Margen({ margen }) {
  if (!margen) return <span className="text-muted">Sin dato</span>;

  const perdida = margen.ganancia < 0;
  return (
    <span className={`font-semibold ${perdida ? "text-red-700" : "text-green-800"}`}>
      {formatearMonto(margen.ganancia)}
      {margen.porcentaje !== null && <span className="font-normal"> · {formatearPorcentaje(margen.porcentaje)}</span>}
      {perdida && <span className="font-normal"> (pérdida)</span>}
    </span>
  );
}

// tarjeta "Rentabilidad": precio, costo y margen unitario de cada producto activo
// onEditar(id): abre el producto en el editor para cargar o corregir el costo
function Rentabilidad({ productos, onEditar }) {
  const sinCosto = productos.filter((producto) => aNumero(producto.costo) === null).length;

  return (
    <Card className="flex flex-col gap-5" aria-labelledby="titulo-rentabilidad">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle id="titulo-rentabilidad">Rentabilidad</CardTitle>
        {productos.length > 0 && (
          <Badge variante={sinCosto > 0 ? "aviso" : "exito"}>
            {sinCosto > 0 ? `${sinCosto} sin costo cargado` : "Todos con costo"}
          </Badge>
        )}
      </div>

      {productos.length === 0 ? (
        <EmptyState titulo="Todavía no hay productos cargados." />
      ) : (
        <div className="overflow-x-auto rounded-control border border-linea">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <caption className="sr-only">Precio, costo y margen por unidad de cada producto</caption>
            <thead>
              <tr className="bg-paper text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                <th scope="col" className="px-4 py-3">Producto</th>
                <th scope="col" className="px-4 py-3 text-right">Precio</th>
                <th scope="col" className="px-4 py-3 text-right">Costo</th>
                <th scope="col" className="px-4 py-3">Margen por unidad</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Acción</span></th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => {
                const costo = aNumero(producto.costo);
                return (
                  <tr key={producto.id} className="border-t border-linea">
                    <th scope="row" className="px-4 py-3 font-semibold text-ink">{producto.nombre}</th>
                    <td className="px-4 py-3 text-right whitespace-nowrap">{formatearMonto(producto.precio)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {costo === null ? <span className="text-muted">Sin dato</span> : formatearMonto(costo)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Margen margen={calcularMargen(producto.precio, producto.costo)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onEditar(producto.id)}
                        aria-label={`${costo === null ? "Cargar" : "Editar"} costo de ${producto.nombre}`}
                        className={boton.secundario}
                      >
                        {costo === null ? "Cargar costo" : "Editar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default Rentabilidad;
