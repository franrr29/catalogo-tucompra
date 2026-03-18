
import { motion } from "framer-motion";

function ComoComprar() {
  return (
    <div className="min-h-screen bg-black text-white px-6 sm:px-12 py-24">
      
      {/* HEADER */}
      <header className="mb-16">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-white text-3xl font-light tracking-[0.4em] uppercase mb-4"
        >
          Cómo <span className="text-amber-500 font-bold">Comprar</span>
        </motion.h1>
        <div className="h-px w-16 bg-amber-500" />
      </header>

      <div className="flex flex-col gap-16 max-w-3xl">

        {/* SECCIÓN: PASOS */}
        <section className="flex flex-col gap-8">
          <h2 className="text-amber-500 text-[10px] tracking-[0.3em] uppercase font-bold">Pasos para comprar</h2>
          {[
            { num: "01", titulo: "Elegí tu producto", desc: "Navegá el catálogo y agregá lo que quieras al carrito." },
            { num: "02", titulo: "Revisá tu carrito", desc: "Verificá los productos y cantidades antes de continuar." },
            { num: "03", titulo: "Finalizá por WhatsApp", desc: "Envianos tu carrito por WhatsApp indicando método para pagar." },
          ].map((paso) => (
            <div key={paso.num} className="flex gap-6 items-start border-b border-white/5 pb-8">
              <span className="text-amber-500 font-bold text-2xl tracking-tighter">{paso.num}</span>
              <div>
                <h3 className="text-white text-sm tracking-widest uppercase mb-1">{paso.titulo}</h3>
                <p className="text-gray-500 text-sm">{paso.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* SECCIÓN: MÉTODOS DE PAGO */}
        <section className="flex flex-col gap-6">
          <h2 className="text-amber-500 text-[10px] tracking-[0.3em] uppercase font-bold">Métodos de pago</h2>
          {[
            { metodo: "Giros", detalle: "Mediante ABITAB o REDPAGOS." },
            { metodo: "Transferencia bancaria", detalle: "Te enviamos los datos por WhatsApp." },
            { metodo: "MercadoPago", detalle: "Nos pedis el link del producto y te enviamos." },
            { metodo: "Transferencias por tarjetas PREX o Mi Dinero", detalle: "Te enviamos numeros de cuenta." }
          ].map((item) => (
            <div key={item.metodo} className="flex justify-between items-center gap-4 border border-white/5 px-6 py-4 bg-white/5">
              <span className="text-white text-xs tracking-widest uppercase">{item.metodo}</span>
              <span className="text-gray-500 text-xs text-right max-w-[50%]">{item.detalle}</span>
            </div>
          ))}
        </section>

        {/* SECCIÓN: ENVÍOS */}
        <section className="flex flex-col gap-6">
          <h2 className="text-amber-500 text-[10px] tracking-[0.3em] uppercase font-bold">Envíos</h2>
          {[
            { zona: "Rivera", detalle: "Coordinamos entrega en Terminal." },
            { zona: "A todo el pais", detalle: "Vía DAC, Turil, COPAY, Nuñez, Correo Uruguayo, etc." },
          ].map((item) => (
            <div key={item.zona} className="flex justify-between items-center border border-white/5 px-6 py-4 bg-white/5">
              <span className="text-white text-xs tracking-widest uppercase">{item.zona}</span>
              <span className="text-gray-500 text-xs">{item.detalle}</span>
            </div>
          ))}
        </section>

      </div>
    </div>
  );
}

export default ComoComprar;






