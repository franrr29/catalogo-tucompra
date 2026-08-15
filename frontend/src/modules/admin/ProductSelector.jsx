import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
          className="bg-transparent border border-border hover:border-[#111111] text-ink text-xs px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors font-sans uppercase select-none bg-white rounded"
        >
          <span className="truncate font-medium text-ink">
            {productoActual
              ? `${productoActual.nombre} — $${productoActual.precio} (Stock: ${productoActual.stock})`
              : "-- Seleccionar producto para editar --"}
          </span>
          <span className={`transform transition-transform duration-200 text-brand font-bold ml-2 ${abierto ? "rotate-180" : ""}`}>
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
              className="absolute left-0 right-0 top-full mt-1 bg-paper border border-border rounded z-50 max-h-60 overflow-y-auto shadow-2xl"
            >
              {productos.length === 0 ? (
                <div className="p-4 text-xs font-sans text-muted uppercase text-center">
                  No hay productos disponibles
                </div>
              ) : (
                productos.map((item) => {
                  const seleccionado = productoActual?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => elegir(item.id)}
                      className={`flex flex-col px-4 py-3.5 cursor-pointer border-b border-[#E2E2DF] last:border-b-0 hover:bg-[#E2E2DF] transition-colors ${
                        seleccionado ? "bg-[#E2E2DF] font-semibold" : ""
                      }`}
                    >
                      <span className="font-sans text-xs text-ink uppercase">{item.nombre}</span>
                      <span className="font-sans text-[10px] text-muted mt-0.5">
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
          className="border border-red-300 text-red-600 text-xs tracking-wider uppercase px-4 py-3.5 hover:bg-red-600 hover:text-white transition-colors font-sans flex items-center justify-center gap-2 whitespace-nowrap rounded"
        >
          Eliminar
        </button>
      )}
    </div>
  );
}

export default ProductSelector;
