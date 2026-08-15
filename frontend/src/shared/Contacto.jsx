import { motion } from "framer-motion";

function Contacto() {
  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased px-6 sm:px-12 lg:px-16 pt-32 pb-20 selection:bg-[#E2E2DF]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 border-b border-border pb-8">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-3 font-sans">
              <span className="w-1.5 h-1.5 bg-brand" />
              <span className="text-[11px] text-muted">CANALES DIRECTOS</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-ink">
              CON<span className="font-semibold text-brand">TACTO</span>
            </h1>
          </motion.div>
        </header>

        <div className="flex flex-col gap-6 max-w-xl">
          <motion.a
            href="https://wa.me/59891637161"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="flex items-center justify-between border border-border rounded-2xl p-6 hover:border-[#111111] transition-colors group"
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs font-sans text-brand font-semibold uppercase tracking-wide">
                WhatsApp
              </span>
              <span className="text-lg font-medium tracking-tight text-ink">
                +598 91 637 161
              </span>
            </div>
            <span className="text-xs font-sans text-ink group-hover:text-brand transition-colors uppercase tracking-wider">
              Enviar mensaje →
            </span>
          </motion.a>

          <motion.a
            href="https://instagram.com/CMPRALO"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center justify-between border border-border rounded-2xl p-6 hover:border-[#111111] transition-colors group"
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs font-sans text-brand font-semibold uppercase tracking-wide">
                Instagram
              </span>
              <span className="text-lg font-medium tracking-tight text-ink">
                @CMPRALO
              </span>
            </div>
            <span className="text-xs font-sans text-ink group-hover:text-brand transition-colors uppercase tracking-wider">
              Ver perfil →
            </span>
          </motion.a>
        </div>
      </div>
    </div>
  );
}

export default Contacto;