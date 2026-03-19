import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../config";

function Cart({ fullCart, setCarrito }) {

  function totalCarrito() {
    return fullCart.reduce((acc, prod) => {
    const precio = parseFloat(prod.precio)
    const precioFinal = isNaN(precio) ? 0 : precio
    return acc + precioFinal * prod.cantidad
  }, 0)};

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


  // Funciones de control (Aumentar, Disminuir, Eliminar)
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

  // Envío de pedido a WhatsApp
  function whatsapp() {
    const productos = fullCart.map(prod => `• ${prod.nombre} (x${prod.cantidad}) - $${prod.precio}`).join("\n");
    const mensaje = `Hola! Me gustaría finalizar mi pedido:\n\n${productos}\n\nTotal: $${totalCarrito()}\n\nQuedo atento/a.`;
    window.open(`https://wa.me/59891637161?text=${encodeURIComponent(mensaje)}`);
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-24 flex justify-center">
      <div className="w-full max-w-3xl">
        
        {/* Título de la página */}
        <header className="mb-12 border-b border-white/10 pb-6">
          <h1 className="text-2xl font-light tracking-[0.4em] uppercase">Mi <span className="text-amber-500 font-bold">Carrito</span></h1>
        </header>

        {fullCart.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="text-gray-500 tracking-widest uppercase text-sm">El carrito está vacío</p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-8">
            
            {/* Lista de productos con AnimatePresence para borrados suaves */}
            <div className="flex flex-col gap-4">
              <AnimatePresence>
                {fullCart.map((producto) => (
                  <motion.div 
                    key={producto.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between bg-white/5 border border-white/5 p-5 rounded-sm group hover:border-white/10 transition-all"
                  >
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm tracking-widest uppercase font-medium">{producto.nombre}</h3>
                      <p className="text-amber-500 font-bold text-lg">${parseFloat(producto.precio).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Controles de cantidad */}
                      <div className="flex items-center border border-white/10 bg-black">
                        <button onClick={() => disminuir(producto.id)} className="px-3 py-1 hover:text-amber-500 transition-colors">-</button>
                        <span className="text-xs w-8 text-center border-x border-white/10">{producto.cantidad}</span>
                        <button onClick={() => aumentar(producto.id)} className="px-3 py-1 hover:text-amber-500 transition-colors">+</button>
                      </div>

                      {/* Botón eliminar */}
                      <button 
                        onClick={() => eliminar(producto.id)}
                        className="text-gray-600 hover:text-red-500 transition-colors text-[10px] uppercase tracking-widest"
                      >
                        Quitar
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Resumen de compra */}
            <motion.footer 
              layout
              className="mt-8 border-t border-white/10 pt-8 flex flex-col items-end gap-6"
            >
              <div className="text-right">
                <p className="text-gray-500 text-[10px] tracking-[0.3em] uppercase mb-1">Total a pagar</p>
                <h2 className="text-4xl font-bold text-white tracking-tighter">
                  <span className="text-amber-500 text-xl mr-2">$</span>
                  {totalCarrito().toLocaleString()}
                </h2>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => whatsapp()}
                className="w-full md:w-auto bg-white text-black px-12 py-4 text-[11px] font-bold tracking-[0.3em] uppercase hover:bg-amber-500 transition-colors duration-500"
              >
                Finalizar Compra via WhatsApp
              </motion.button>
            </motion.footer>

          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;