import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function NotFound() {
  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased flex flex-col items-center justify-center px-6 selection:bg-[#E2E2DF]">
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-auto"
      >
        <div className="flex items-center justify-center gap-2 mb-6 font-sans">
          <span className="w-1.5 h-1.5 bg-brand" />
          <span className="text-[11px] text-muted uppercase tracking-widest">
            ERROR 404
          </span>
        </div>

        <h1 className="text-6xl sm:text-8xl font-light tracking-tight text-ink mb-6 font-sans">
          40<span className="font-medium text-brand">4</span>
        </h1>

        <div className="flex flex-col items-center gap-3 mb-12">
          <h2 className="text-sm font-medium tracking-wide uppercase text-ink">
            Página no encontrada
          </h2>
          <p className="text-xs text-muted leading-relaxed font-sans">
            El recurso solicitado no existe o ha sido reubicado dentro del catálogo general.
          </p>
        </div>

        <Link 
          to="/" 
          className="text-xs text-ink border border-border hover:border-[#111111] hover:bg-[#111111] hover:text-[#F4F4F2] px-8 py-3.5 transition-all uppercase tracking-wider font-sans inline-block"
        >
          Volver al inicio
        </Link>
      </motion.div>

    </div>
  );
}

export default NotFound;