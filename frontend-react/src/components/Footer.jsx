import { motion } from "framer-motion";

function Footer() {
  // Año actual de forma dinámica
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-white/5 px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
      
      {/* SECCIÓN IZQUIERDA: Logo o Marca en pequeño */}
      <div className="flex flex-col items-center md:items-start gap-2">
        <h2 className="text-white text-[10px] tracking-[0.5em] uppercase font-bold">
          Tu<span className="text-amber-500">Compra</span>
        </h2>
      </div>

      {/* SECCIÓN CENTRAL: Links sociales con animación */}
      <div className="flex gap-8">
        {[
          { nombre: "Instagram", url: "https://instagram.com/CMPRALO" },
          { nombre: "WhatsApp", url: "https://wa.me/59891637161" }
        ].map((red) => (
          <motion.a
            key={red.nombre}
            href={red.url}
            target="_blank"
            className="group relative text-gray-500 text-[10px] tracking-[0.3em] uppercase hover:text-white transition-colors duration-300"
          >
            {red.nombre}

            {/* Subrayado elegante que nace del centro */}
            <span className="absolute -bottom-1 left-1/2 w-0 h-[1px] bg-amber-500 transition-all duration-300 group-hover:w-full group-hover:left-0" />
          </motion.a>
        ))}
      </div>

      {/* SECCIÓN DERECHA: Copyright */}
      <div className="flex flex-col items-center md:items-end gap-1">
        <p className="text-gray-600 text-[9px] tracking-[0.2em] uppercase">
          © {year} Todos los derechos reservados.
        </p>
        <p className="text-gray-700 text-[8px] tracking-[0.1em] uppercase">
          Desarrollado con precisión digital.
        </p>
      </div>

    </footer>
  );
}

export default Footer;