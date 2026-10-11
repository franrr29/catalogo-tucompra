import { motion } from "framer-motion";

const WHATSAPP = "59891637161";
const MENSAJE = "Hola! Quiero consultar la promo llevando 2 relojes";

// banner de promo entre el hero y el catalogo: fondo con brillo dorado animado
function PromoBanner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative isolate overflow-hidden rounded-2xl bg-black text-white max-w-7xl mx-auto"
    >
      {/* foto del hero apagada de fondo */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center opacity-30"
        style={{ backgroundImage: 'url("/banner.jpeg")' }}
      />

      {/* resplandor dorado que se desplaza lento (el "gif" de fondo) */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(115deg, transparent 20%, rgba(200,146,17,0.55) 45%, rgba(255,214,102,0.35) 50%, rgba(200,146,17,0.55) 55%, transparent 80%)",
          backgroundSize: "250% 100%",
        }}
        animate={{ backgroundPosition: ["120% 0%", "-20% 0%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      {/* borde interior fino dorado */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-brand/50 pointer-events-none" />

      <div className="px-6 sm:px-12 py-8 sm:py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-sans text-brand uppercase tracking-[0.3em]">
            🎁 Promo especial
          </span>
          <h2 className="text-2xl sm:text-3xl font-normal tracking-tight">
            Llevando <span className="text-brand font-semibold">2 unidades</span> tenés promo
          </h2>
          <p className="text-sm text-white/70">
            Consultanos y te armamos el mejor precio para tu combo.
          </p>
        </div>

        <a
          href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(MENSAJE)}`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 bg-brand hover:bg-[#A3740A] text-white text-xs font-sans font-medium uppercase tracking-wider px-7 py-3.5 rounded transition-colors"
        >
          Consultar promo
        </a>
      </div>
    </motion.section>
  );
}

export default PromoBanner;
