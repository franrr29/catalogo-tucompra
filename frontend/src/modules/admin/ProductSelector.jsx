import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { boton } from "./ui/estilos";

// dropdown para elegir que producto editar o eliminar
function ProductSelector({ productos, productoActual, onSeleccionar, onEliminar }) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    function alHacerClickAfuera(evento) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", alHacerClickAfuera);
    return () => document.removeEventListener("mousedown", alHacerClickAfuera);
  }, []);

  function elegir(id) {
    onSeleccionar(id);
    setAbierto(false);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch relative" ref={contenedorRef}>

      <div className="flex-1 relative">
        <div
          onClick={() => setAbierto(!abierto)}
          className="border border-campo hover:border-ink text-ink text-sm px-4 py-3 flex items-center justify-between cursor-pointer transition-colors duration-150 motion-reduce:transition-none select-none bg-superficie rounded-control"
        >
          <span className="truncate font-medium text-ink">
            {productoActual
              ? `${productoActual.nombre} — $${productoActual.precio} (Stock: ${productoActual.stock})`
              : "-- Seleccionar producto para editar --"}
          </span>
          <span className={`transform transition-transform duration-200 motion-reduce:transition-none text-oro-texto text-xs ml-2 ${abierto ? "rotate-180" : ""}`}>
            ▼
          </span>
        </div>

        <AnimatePresence>
          {abierto && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-2 bg-superficie border border-linea rounded-tarjeta z-50 max-h-60 overflow-y-auto shadow-elevada"
            >
              {productos.length === 0 ? (
                <div className="p-5 text-sm text-muted text-center">
                  No hay productos disponibles
                </div>
              ) : (
                productos.map((item) => {
                  const seleccionado = productoActual?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => elegir(item.id)}
                      className={`flex flex-col px-5 py-3 cursor-pointer border-b border-linea last:border-b-0 hover:bg-paper transition-colors duration-150 motion-reduce:transition-none ${
                        seleccionado ? "bg-oro-suave/60" : ""
                      }`}
                    >
                      <span className="text-sm font-semibold text-ink">{item.nombre}</span>
                      <span className="text-xs text-muted mt-0.5">
                        Precio: ${item.precio} — Stock: {item.stock} unidades
                      </span>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {productoActual && (
        <button
          onClick={() => onEliminar(productoActual.id)}
          className={`${boton.peligro} whitespace-nowrap`}
        >
          Eliminar
        </button>
      )}
    </div>
  );
}

export default ProductSelector;
