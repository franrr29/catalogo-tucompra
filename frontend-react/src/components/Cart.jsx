import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../config";

function Cart({ fullCart, setCarrito }) {

  function totalCarrito() {
    return fullCart.reduce((acc, prod) => {
      const precio = parseFloat(prod.precio);
      const precioFinal = isNaN(precio) ? 0 : precio;
      return acc + precioFinal * prod.cantidad;
    }, 0);
  }

  useEffect(() => {
    async function sendProdctsIds() {
      if (fullCart.length === 0) return;
      try {
        const productosIds = fullCart.map((p) => p.id);
        const res = await fetch(API_URL + "/api/cart/verificar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productosIds })
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCarrito(data.carrito.map((item) => {
          const found = fullCart.find((p) => p.id === item.id);
          return { ...item, cantidad: found ? found.cantidad : 1 };
        }));
      } catch {
        console.error("Error al verificar carrito");
      }
    }
    sendProdctsIds();
  }, []);

  function aumentar(id) {
    setCarrito((actualCart) =>
      actualCart.map((item) => item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item)
    );
  }

  function disminuir(id) {
    const producto = fullCart.find(item => item.id === id);
    if (producto.cantidad === 1) {
      eliminar(id);
    } else {
      setCarrito((actualCart) =>
        actualCart.map((item) => item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item)
      );
    }
  }

  function eliminar(id) {
    setCarrito(fullCart.filter(item => item.id !== id));
  }

  function whatsapp() {
    const productos = fullCart.map(prod => `• ${prod.nombre} (x${prod.cantidad}) - $${prod.precio}`).join("\n");
    const mensaje = `Buenas! Me gustaría finalizar mi pedido:\n\n${productos}\n\nTotal: $${totalCarrito()}\n\n Aguardo confirmacion`;
    window.open(`https://wa.me/59891637161?text=${encodeURIComponent(mensaje)}`);
  }

  return (
    <div className="min-h-screen bg-[#F4F4F2] text-[#111111] font-sans antialiased px-6 sm:px-12 lg:px-16 pt-32 pb-24 selection:bg-[#E2E2DF]">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-16 border-b border-[#CCCCCC] pb-8">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-3 font-sans">
              <span className="w-1.5 h-1.5 bg-[#C89211]" />
              <span className="text-xs text-[#111111] font-semibold">RESUMEN DE COMPRAS</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-[#111111]">
              MI <span className="font-semibold text-[#C89211]">CARRITO</span>
            </h1>
          </motion.div>
        </header>

        {fullCart.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="border border-[#CCCCCC] p-16 text-center bg-transparent"
          >
            <div className="flex items-center justify-center gap-2 mb-4 font-sans">
              <span className="w-1.5 h-1.5 bg-[#C89211]" />
              <span className="text-xs text-[#111111] font-semibold uppercase tracking-wider">ESTADO VACÍO</span>
            </div>
            <h3 className="text-2xl font-light text-[#111111] mb-2">Tu carrito se encuentra vacío</h3>
            <p className="text-sm text-[#111111] font-sans tracking-wider uppercase">
              Agregue artículos desde el catálogo general para continuar.
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-12">
            
            <div className="flex flex-col gap-4">
              <AnimatePresence>
                {fullCart.map((producto) => (
                  <motion.div 
                    key={producto.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between border border-[#CCCCCC] p-6 sm:p-8 bg-transparent gap-6 group hover:border-[#111111] transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-sans text-[#111111] font-medium uppercase tracking-wider">
                        {producto.nombre}
                      </h3>
                      <p className="text-[#111111] font-light text-2xl tracking-tight">
                        <span className="text-[#C89211] text-lg mr-1 font-sans">$</span>
                        {parseFloat(producto.precio).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8">
                      {/* Controles de cantidad */}
                      <div className="flex items-center border border-[#CCCCCC] bg-transparent h-10">
                        <button 
                          onClick={() => disminuir(producto.id)} 
                          className="w-10 h-full flex items-center justify-center bg-red-600 text-[#111111] hover:bg-red-700 transition-colors font-sans text-base font-bold"
                          aria-label="Disminuir cantidad"
                        >
                          -
                        </button>
                        <span className="text-sm w-10 text-center font-sans font-bold text-[#111111]">
                          {producto.cantidad}
                        </span>
                        <button 
                          onClick={() => aumentar(producto.id)} 
                          className="w-10 h-full flex items-center justify-center bg-green-600 text-[#111111] hover:bg-green-700 transition-colors font-sans text-base font-bold"
                          aria-label="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>

                      <button 
                        onClick={() => eliminar(producto.id)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors text-sm font-sans uppercase tracking-wider font-semibold"
                        aria-label="Eliminar producto"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Resumen de compra */}
            <motion.footer 
              layout
              className="border border-[#CCCCCC] p-8 sm:p-12 bg-transparent flex flex-col items-end gap-8"
            >
              <div className="w-full flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-[#CCCCCC] pb-8 gap-4">
                <div className="flex items-center gap-2 font-sans">
                  <span className="w-1.5 h-1.5 bg-[#C89211]" />
                  <span className="text-xs text-[#111111] font-semibold uppercase tracking-wider">TOTAL GENERAL</span>
                </div>
                <div className="text-left sm:text-right">
                  <h2 className="text-4xl sm:text-5xl font-light text-[#111111] tracking-tight">
                    <span className="text-[#C89211] text-2xl mr-2 font-sans font-medium">$</span>
                    {totalCarrito().toLocaleString()}
                  </h2>
                </div>
              </div>

              <button 
                onClick={() => whatsapp()}
                className="w-full sm:w-auto text-sm text-white bg-[#25D366] hover:bg-[#20ba59] px-8 py-4 transition-colors uppercase tracking-widest font-sans font-semibold flex items-center justify-center gap-3 shadow-sm"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.316 1.592 5.43 0 9.856-4.426 9.858-9.855.002-5.43-4.424-9.856-9.855-9.856-5.431 0-9.856 4.426-9.858 9.856-.001 1.938.529 3.403 1.486 5.15l-.95 3.468 3.553-.931z"/>
                </svg>
                Finalizar pedido por WhatsApp
              </button>
            </motion.footer>

          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;