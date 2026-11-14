import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatearFecha, formatearMonto } from "./formato";

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
        className="relative p-2 rounded border border-transparent hover:border-border focus:outline-none focus-visible:border-[#111111] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {cantidad > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-brand text-white text-[10px] font-bold leading-[1.1rem] text-center"
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
          className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-paper border border-border rounded shadow-2xl z-40 flex flex-col"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink">Ventas nuevas</h2>
            {cantidad > 0 && (
              <button
                type="button"
                onClick={onMarcarVistas}
                className="text-[11px] uppercase tracking-wider text-muted hover:text-ink underline underline-offset-2"
              >
                Marcar como vistas
              </button>
            )}
          </div>

          {cantidad === 0 ? (
            <p className="px-4 py-6 text-xs text-muted text-center">No hay ventas nuevas.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {ultimos.map((venta) => (
                <li key={venta.id} className="border-b border-[#E2E2DF] last:border-b-0">
                  <Link
                    to="/admin/envios"
                    onClick={() => setAbierta(false)}
                    className="flex flex-col gap-0.5 px-4 py-3 text-xs hover:bg-[#E2E2DF]/60 focus:outline-none focus-visible:bg-[#E2E2DF]"
                  >
                    <span className="flex justify-between gap-3">
                      <span className="font-semibold truncate">{venta.nombre}</span>
                      <span className="font-semibold whitespace-nowrap">{formatearMonto(venta.total)}</span>
                    </span>
                    <span className="flex justify-between gap-3 text-muted">
                      <span className="truncate">{venta.ciudad}</span>
                      <span className="whitespace-nowrap">{formatearFecha(venta.fecha)}</span>
                    </span>
                  </Link>
                </li>
              ))}
              {hayMas && (
                <li className="px-4 py-3 text-xs text-muted text-center">
                  y {cantidad - ultimos.length} más
                </li>
              )}
            </ul>
          )}

          <Link
            to="/admin/envios"
            onClick={() => setAbierta(false)}
            className="px-4 py-3 border-t border-border text-[11px] uppercase tracking-wider text-center text-ink hover:bg-[#E2E2DF]/60 focus:outline-none focus-visible:bg-[#E2E2DF]"
          >
            Ver envíos
          </Link>
        </div>
      )}
    </div>
  );
}

export default CampanitaVentas;
