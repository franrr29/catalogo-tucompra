import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function PagoPendiente() {
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
            PAGO EN REVISIÓN
          </span>
        </div>

        <div className="flex justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-14 h-14 text-brand">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-ink mb-6 font-sans">
          PAGO <span className="font-medium text-brand">PENDIENTE</span>
        </h1>

        <div className="flex flex-col items-center gap-3 mb-12">
          <p className="text-xs text-muted leading-relaxed font-sans">
            Tu pago está pendiente de confirmación. Te notificaremos una vez que se confirme.
          </p>
        </div>

        <Link
          to="/"
          className="text-xs text-ink border border-border hover:border-[#111111] hover:bg-[#111111] hover:text-paper px-8 py-3.5 transition-all uppercase tracking-wider font-sans inline-block"
        >
          Volver al inicio
        </Link>
      </motion.div>

    </div>
  );
}

export default PagoPendiente;
