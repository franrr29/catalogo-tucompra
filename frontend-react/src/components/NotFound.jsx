import { Link } from "react-router-dom";
import { motion } from "framer-motion";

//---COMPONENTE QUE INDICA QUE NO EXISTE Y REDIRIGE A INICIO---//

function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 selection:bg-amber-500/30">
      
      {/* Contenedor principal con entrada suave */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        {/* Número 404 con estilo de lujo */}
        <h1 className="text-white text-8xl md:text-9xl font-bold tracking-tighter mb-4">
          40<span className="text-amber-500">4</span>
        </h1>

        {/* Mensaje de error */}
        <div className="flex flex-col items-center gap-2 mb-12">
          <h2 className="text-white text-sm tracking-[0.4em] uppercase font-light">
            Página no encontrada
          </h2>
          <div className="h-px w-12 bg-amber-500/50" />
        </div>

        {/* Botón de retorno siguiendo tu estética de botones */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link 
            to="/" 
            className="border border-white/20 px-10 py-4 text-[11px] text-white tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all duration-500 inline-block"
          >
            Volver al inicio
          </Link>
        </motion.div>
      </motion.div>

      {/* Decoración sutil de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full" />
      </div>

    </div>
  );
}

export default NotFound;