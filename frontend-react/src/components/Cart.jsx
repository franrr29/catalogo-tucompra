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
    const mensaje = `Hola! Me gustaría finalizar mi pedido:\n\n${productos}\n\nTotal: $${totalCarrito()}\n\nQuedo atento/a.`;
    window.open(`https://wa.me/59891637161?text=${encodeURIComponent(mensaje)}`);
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-32 pb-20 flex justify-center">
      <div className="w-full max-w-3xl">
        
        <header className="mb-12 border-b border-white/5 pb-8">
          <h1 className="text-3xl font-light tracking-[0.4em] uppercase text-center md:text-left">
            Mi <span className="text-amber-500 font-bold">Carrito</span>
          </h1>
        </header>

        {fullCart.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
            <p className="text-neutral-500 tracking-[0.3em] uppercase text-xs">Tu selección está vacía</p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-8">
            
            <div className="flex flex-col gap-4">
              <AnimatePresence>
                {fullCart.map((producto) => (
                  <motion.div 
                    key={producto.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/10 border-t-white/20 p-6 rounded-2xl group transition-all duration-500"
                  >
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[11px] tracking-[0.2em] uppercase text-neutral-400 group-hover:text-white transition-colors">
                        {producto.nombre}
                      </h3>
                      <p className="text-white font-light text-xl tracking-tighter">
                        <span className="text-amber-500 text-sm mr-1">$</span>
                        {parseFloat(producto.precio).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-8">
                      {/* Controles de cantidad minimalistas */}
                      <div className="flex items-center bg-black/40 border border-white/10 rounded-lg overflow-hidden h-10">
                        <button onClick={() => disminuir(producto.id)} className="px-4 h-full hover:bg-amber-500 hover:text-white transition-all duration-300">-</button>
                        <span className="text-[10px] w-10 text-center font-bold tracking-widest">{producto.cantidad}</span>
                        <button onClick={() => aumentar(producto.id)} className="px-4 h-full hover:bg-amber-500 hover:text-white transition-all duration-300">+</button>
                      </div>

                      <button 
                        onClick={() => eliminar(producto.id)}
                        className="text-neutral-600 hover:text-red-500 transition-colors text-[9px] uppercase tracking-[0.2em] font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Resumen de compra */}
            <motion.footer 
              layout
              className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 border-t-white/20 p-8 rounded-2xl flex flex-col items-center md:items-end gap-8"
            >
              <div className="text-center md:text-right w-full">
                <p className="text-neutral-500 text-[10px] tracking-[0.4em] uppercase mb-2">Inversión Total</p>
                <h2 className="text-5xl font-extralight text-white tracking-tighter italic md:not-italic">
                  <span className="text-amber-500 text-2xl mr-2 font-normal">$</span>
                  {totalCarrito().toLocaleString()}
                </h2>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: "#fbbf24" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => whatsapp()}
                className="w-full md:w-auto bg-amber-500 text-white px-10 py-5 rounded-xl text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-500 flex items-center justify-center gap-3 shadow-lg shadow-amber-500/10"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.316 1.592 5.43 0 9.856-4.426 9.858-9.855.002-5.43-4.424-9.856-9.855-9.856-5.431 0-9.856 4.426-9.858 9.856-.001 1.938.529 3.403 1.486 5.15l-.95 3.468 3.553-.931z"/>
                </svg>
                Finalizar Pedido
              </motion.button>
            </motion.footer>

          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;