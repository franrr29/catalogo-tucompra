import { motion } from "framer-motion";
import { optimizarUrl } from "../../shared/imagenes";
import { formatearPrecio } from "../../shared/formato";

function BotonRedondo({ onClick, label, className = "", children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function CartItem({ producto, onAumentar, onDisminuir, onEliminar }) {
  const precio = parseFloat(producto.precio) || 0;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
      className="flex gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-white/60 border border-border shadow-sm"
    >
      <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-paper border border-border">
        {producto.imagen_url ? (
          <img
            src={optimizarUrl(producto.imagen_url, 300)}
            alt={producto.nombre}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-ink/40">
            Sin imagen
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-medium text-ink truncate">{producto.nombre}</h3>
            <p className="text-xs text-ink/50 mt-0.5">{formatearPrecio(precio)} c/u</p>
          </div>
          <BotonRedondo
            onClick={onEliminar}
            label="Eliminar producto"
            className="text-ink/40 hover:text-red-600 hover:bg-red-50 -mt-1 -mr-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </BotonRedondo>
        </div>

        <div className="flex items-end justify-between mt-3">
          <div className="flex items-center gap-1 rounded-full border border-border bg-paper p-0.5">
            <BotonRedondo onClick={onDisminuir} label="Disminuir cantidad" className="hover:bg-white">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M5 12h14" />
              </svg>
            </BotonRedondo>
            <span className="w-6 text-center text-sm font-semibold tabular-nums">{producto.cantidad}</span>
            <BotonRedondo onClick={onAumentar} label="Aumentar cantidad" className="hover:bg-white">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
            </BotonRedondo>
          </div>
          <p className="text-lg sm:text-xl font-semibold tracking-tight text-ink">
            {formatearPrecio(precio * producto.cantidad)}
          </p>
        </div>
      </div>
    </motion.li>
  );
}

export default CartItem;
