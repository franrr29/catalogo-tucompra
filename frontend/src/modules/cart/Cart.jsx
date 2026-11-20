import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { verificarCarrito } from "../../services/carrito.service";
import { formatearPrecio } from "../../shared/formato";
import CartItem from "./CartItem";
import CartResumen from "./CartResumen";

const NUMERO_WHATSAPP = "59891637161";

function CarritoVacio() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-border bg-white/60 p-16 text-center"
    >
      <h3 className="text-2xl font-light text-ink mb-2">Tu carrito está vacío</h3>
      <p className="text-sm text-ink/60 mb-6">Agregá productos desde el catálogo para continuar.</p>
      <Link
        to="/"
        className="inline-block rounded-xl bg-ink-soft hover:bg-brand text-white text-sm font-semibold uppercase tracking-widest px-6 py-3 transition-colors"
      >
        Ver catálogo
      </Link>
    </motion.div>
  );
}

function Cart({ fullCart, setCarrito }) {
  const navigate = useNavigate();
  const totalArticulos = fullCart.reduce((acc, item) => acc + item.cantidad, 0);
  const total = fullCart.reduce((acc, p) => acc + (parseFloat(p.precio) || 0) * p.cantidad, 0);

  // al abrir el carrito se refrescan los datos (precio, stock, imagen) desde el servidor
  useEffect(() => {
    async function refrescarCarrito() {
      if (fullCart.length === 0) return;
      try {
        const data = await verificarCarrito(fullCart.map((p) => p.id));
        setCarrito(data.carrito.map((item) => {
          const found = fullCart.find((p) => p.id === item.id);
          return { ...item, cantidad: found ? found.cantidad : 1 };
        }));
      } catch {
        console.error("Error al verificar carrito");
      }
    }
    refrescarCarrito();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cambiarCantidad(id, delta) {
    setCarrito((actual) => actual.map((item) =>
      item.id === id ? { ...item, cantidad: item.cantidad + delta } : item
    ));
  }

  function eliminar(id) {
    setCarrito((actual) => actual.filter((item) => item.id !== id));
  }

  function disminuir(producto) {
    if (producto.cantidad === 1) eliminar(producto.id);
    else cambiarCantidad(producto.id, -1);
  }

  function whatsapp() {
    const lineas = fullCart.map((p) => `• ${p.nombre} (x${p.cantidad}) - ${formatearPrecio(p.precio)}`).join("\n");
    const mensaje = `Buenas! Me gustaría finalizar mi pedido:\n\n${lineas}\n\nTotal: ${formatearPrecio(total)}\n\nAguardo confirmación`;
    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`);
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased px-6 sm:px-12 lg:px-16 pt-32 pb-24">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex items-end justify-between">
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight">
            Mi <span className="font-semibold text-brand">carrito</span>
          </h1>
          {fullCart.length > 0 && (
            <span className="text-xs font-semibold tracking-wider text-ink/70 bg-white/70 px-3.5 py-1.5 rounded-full border border-border">
              {totalArticulos} {totalArticulos === 1 ? "ÍTEM" : "ÍTEMS"}
            </span>
          )}
        </header>

        {fullCart.length === 0 ? (
          <CarritoVacio />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_340px] items-start">
            <ul className="flex flex-col gap-4">
              <AnimatePresence mode="popLayout">
                {fullCart.map((producto) => (
                  <CartItem
                    key={producto.id}
                    producto={producto}
                    onAumentar={() => cambiarCantidad(producto.id, 1)}
                    onDisminuir={() => disminuir(producto)}
                    onEliminar={() => eliminar(producto.id)}
                  />
                ))}
              </AnimatePresence>
            </ul>

            <CartResumen
              total={total}
              totalArticulos={totalArticulos}
              onWhatsapp={whatsapp}
              onPagar={() => navigate("/checkout")}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
