import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatearFecha, formatearMonto } from "./formato";
import { IconoCampana } from "./ui/iconos";
import { boton, enlace } from "./ui/estilos";

// campanita del header: cuenta las ventas nuevas y despliega las ultimas
// cantidad: ventas nuevas sin ver; ultimos: las mas recientes (nombre, total, ciudad); onMarcarVistas: las da por vistas
function CampanitaVentas({ cantidad, ultimos, onMarcarVistas }) {
  const [abierta, setAbierta] = useState(false);
  const contenedorRef = useRef(null);
  const botonRef = useRef(null);

  // se cierra con Escape (devolviendo el foco al boton) o al tocar fuera
  useEffect(() => {
    if (!abierta) return undefined;

    function alTeclear(evento) {
      if (evento.key === "Escape") {
        setAbierta(false);
        botonRef.current?.focus();
      }
    }
    function alTocarFuera(evento) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setAbierta(false);
      }
    }

    window.addEventListener("keydown", alTeclear);
    document.addEventListener("mousedown", alTocarFuera);
    return () => {
      window.removeEventListener("keydown", alTeclear);
      document.removeEventListener("mousedown", alTocarFuera);
    };
  }, [abierta]);

  const hayMas = cantidad > ultimos.length;

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        ref={botonRef}
        type="button"
        onClick={() => setAbierta((valor) => !valor)}
        aria-label={cantidad > 0 ? `Ventas nuevas: ${cantidad}` : "Ventas nuevas: ninguna"}
        aria-expanded={abierta}
        aria-controls="panel-ventas-nuevas"
        className={`${boton.secundario} relative !px-2.5`}
      >
        <IconoCampana className="w-5 h-5" />
        {cantidad > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 px-1 rounded-full bg-oro-acento text-ink text-xs font-bold leading-5 text-center ring-2 ring-paper"
          >
            {cantidad > 99 ? "99+" : cantidad}
          </span>
        )}
      </button>

      {abierta && (
        <div
          id="panel-ventas-nuevas"
          role="region"
          aria-label="Ventas nuevas"
          className="absolute right-0 top-full mt-3 w-80 max-w-[calc(100vw-2rem)] bg-superficie border border-linea rounded-tarjeta shadow-elevada z-40 flex flex-col overflow-hidden animate-aparecer motion-reduce:animate-none"
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-linea">
            <h2 className="text-sm font-semibold text-ink">Ventas nuevas</h2>
            {cantidad > 0 && (
              <button
                type="button"
                onClick={onMarcarVistas}
                className={enlace}
              >
                Marcar como vistas
              </button>
            )}
          </div>

          {cantidad === 0 ? (
            <p className="px-5 py-8 text-sm text-muted text-center">No hay ventas nuevas.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {ultimos.map((venta) => (
                <li key={venta.id} className="border-b border-linea last:border-b-0">
                  <Link
                    to="/admin/envios"
                    onClick={() => setAbierta(false)}
                    className="flex flex-col gap-1 px-5 py-3.5 text-sm hover:bg-paper focus:outline-none focus-visible:bg-paper focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-oro-acento"
                  >
                    <span className="flex justify-between gap-3">
                      <span className="font-semibold truncate">{venta.nombre}</span>
                      <span className="font-semibold whitespace-nowrap">{formatearMonto(venta.total)}</span>
                    </span>
                    <span className="flex justify-between gap-3 text-xs text-muted">
                      <span className="truncate">{venta.ciudad}</span>
                      <span className="whitespace-nowrap">{formatearFecha(venta.fecha)}</span>
                    </span>
                  </Link>
                </li>
              ))}
              {hayMas && (
                <li className="px-5 py-3 text-sm text-muted text-center">
                  y {cantidad - ultimos.length} más
                </li>
              )}
            </ul>
          )}

          <Link
            to="/admin/envios"
            onClick={() => setAbierta(false)}
            className="px-5 py-3.5 border-t border-linea text-xs font-semibold uppercase tracking-[0.06em] text-center text-ink hover:bg-paper focus:outline-none focus-visible:bg-paper focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-oro-acento"
          >
            Ver envíos
          </Link>
        </div>
      )}
    </div>
  );
}

export default CampanitaVentas;
