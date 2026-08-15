import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function Exito() {
  const [localstg, setLocalstg] = useState(null);

  useEffect(() => {
    const carrito = localStorage.getItem("productos");
    if (carrito) {
      setLocalstg(JSON.parse(carrito));
    }
    localStorage.removeItem("productos");
  }, []);

  function whatsapp() {
    const productos = localstg
      .map((prod) => `• ${prod.nombre} × ${prod.cantidad} — $${prod.precio * prod.cantidad}`)
      .join("\n");

    const total = localstg.reduce(
      (acc, prod) => acc + prod.precio * prod.cantidad,
      0
    );

    const mensaje = `¡Hola! 👋\n\nRealicé el pago de mi pedido correctamente ✅\n\n
    📦 *Detalle del pedido:*\n${productos}\n\n
    💰 *Total pagado: $${total}*\n\n
    El pago fue realizado exitosamente. Quedo a la espera de la confirmación y coordinación de la entrega.\n\n
    ¡Muchas gracias!`;

    window.open(
      `https://wa.me/59891637161?text=${encodeURIComponent(mensaje)}`,
      "_blank"
    );
  }

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
            PEDIDO CONFIRMADO
          </span>
        </div>

        <div className="flex justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-14 h-14 text-brand">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-ink mb-6 font-sans">
          PAGO <span className="font-medium text-brand">EXITOSO</span>
        </h1>

        <div className="flex flex-col items-center gap-3 mb-12">
          <p className="text-xs text-muted leading-relaxed font-sans">
            Tu compra fue procesada correctamente. Coordinamos la entrega por WhatsApp.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          {localstg && localstg.length > 0 && (
            <button
              onClick={whatsapp}
              className="text-xs text-paper bg-brand hover:bg-[#A3740A] px-8 py-3.5 transition-colors uppercase tracking-wider font-sans inline-block"
            >
              Contactar por WhatsApp
            </button>
          )}

          <Link
            to="/"
            className="text-xs text-ink border border-border hover:border-[#111111] hover:bg-[#111111] hover:text-paper px-8 py-3.5 transition-all uppercase tracking-wider font-sans inline-block"
          >
            Volver al inicio
          </Link>
        </div>
      </motion.div>

    </div>
  );
}

export default Exito;
