import { motion } from "framer-motion";

function Contacto() {
  return (
    <div className="min-h-screen bg-black text-white px-6 sm:px-12 py-24">

      {/* HEADER */}
      <header className="mb-16">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-white text-3xl font-light tracking-[0.4em] uppercase mb-4"
        >
          Con<span className="text-amber-500 font-bold">tacto</span>
        </motion.h1>
        <div className="h-px w-16 bg-amber-500" />
      </header>

      <div className="flex flex-col gap-8 max-w-lg">

        {/* WHATSAPP */}
        <motion.a
          href="https://wa.me/59891637161"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ x: 6 }}
          className="flex items-center justify-between border border-white/5 bg-white/5 px-6 py-5 hover:border-amber-500/30 transition-all duration-300 group"
        >
          <div className="flex flex-col gap-1">
            <span className="text-amber-500 text-[9px] tracking-[0.3em] uppercase font-bold">WhatsApp</span>
            <span className="text-white text-sm tracking-widest">+598 91 637 161</span>
          </div>
          <span className="text-gray-600 group-hover:text-amber-500 transition-colors text-lg">Enviar mensaje</span>
        </motion.a>

        {/* INSTAGRAM */}
        <motion.a
          href="https://instagram.com/CMPRALO"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ x: 6 }}
          className="flex items-center justify-between border border-white/5 bg-white/5 px-6 py-5 hover:border-amber-500/30 transition-all duration-300 group"
        >
          <div className="flex flex-col gap-1">
            <span className="text-amber-500 text-[9px] tracking-[0.3em] uppercase font-bold">Instagram</span>
            <span className="text-white text-sm tracking-widest">@TU COMPRA</span>
          </div>
          <span className="text-gray-600 group-hover:text-amber-500 transition-colors text-lg">→</span>
        </motion.a>

      </div>
    </div>
  );
}

export default Contacto;