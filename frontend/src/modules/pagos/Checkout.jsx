import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { crearPago } from "../../services/pedidos.service";

// formulario de checkout para realizar el pago
function Checkout() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // resetea el boton si vuelve desde mercado pago con la pagina en cache
  useEffect(() => {
    function handlePageShow(event) {
      if (event.persisted) {
        setEnviando(false);
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const items = localStorage.getItem("productos")
    ? JSON.parse(localStorage.getItem("productos"))
    : [];

  const itemFormateado = items.map((producto) => ({
    productoId: producto.id,
    cantidad: producto.cantidad,
  }));

  const total = items.reduce(
    (acc, prod) => acc + parseFloat(prod.precio) * prod.cantidad,
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      const respuesta = await crearPago({ ...form, items: itemFormateado });
      window.location.href = respuesta.pedido.init_point;
    } catch (err) {
      console.error("Error al crear el pago:", err);
      setError(
        err?.response?.data?.mensaje ||
          "No pudimos iniciar el pago. Intenta nuevamente."
      );
      setEnviando(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-paper text-ink font-sans antialiased px-6 sm:px-12 lg:px-16 pt-32 pb-24">
        <div className="max-w-2xl mx-auto rounded-2xl border border-[#1A1A1A]/15 bg-white/40 backdrop-blur-md p-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 bg-brand" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              CARRITO VACÍO
            </span>
          </div>
          <h3 className="text-2xl font-light mb-2">
            No hay productos para pagar
          </h3>
          <p className="text-sm text-muted mb-8">
            Agregá artículos desde el catálogo para continuar con el pago.
          </p>
          <Link
            to="/"
            className="inline-block rounded-xl text-sm text-white bg-ink-soft hover:bg-brand px-8 py-4 transition-colors uppercase tracking-widest font-semibold"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased px-6 sm:px-12 lg:px-16 pt-32 pb-24">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16 border-b border-border pb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 bg-brand" />
            <span className="text-xs font-semibold">DATOS DE PAGO</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-light tracking-tight">
            FINALIZAR <span className="font-semibold text-brand">COMPRA</span>
          </h1>
        </header>

        <div className="flex flex-col gap-12">
          {/* formulario */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-light">
                Nombre completo
              </label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Juan Pérez"
                className="w-full bg-white/50 rounded-lg border border-[#1A1A1A]/15 focus:border-brand outline-none px-4 py-3 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-light">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="juan@email.com"
                className="w-full bg-white/50 rounded-lg border border-[#1A1A1A]/15 focus:border-brand outline-none px-4 py-3 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-light">
                Teléfono
              </label>
              <input
                type="tel"
                required
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="099123456"
                className="w-full bg-white/50 rounded-lg border border-[#1A1A1A]/15 focus:border-brand outline-none px-4 py-3 text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className={`w-full rounded-xl text-sm text-white px-8 py-4 transition-colors uppercase tracking-widest font-semibold mt-2 ${
                enviando
                  ? "bg-[#D1D1D1] text-[#888888] cursor-not-allowed"
                  : "bg-ink-soft hover:bg-brand"
              }`}
            >
              {enviando ? "Procesando..." : "Pagar con Mercado Pago"}
            </button>
          </form>

          {/* resumen del pedido */}
          <aside className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-white/40 backdrop-blur-md p-6 h-fit flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="w-1.5 h-1.5 bg-brand" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Resumen del pedido
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {items.map((prod) => (
                <div key={prod.id} className="flex justify-between text-sm gap-2">
                  <span className="text-[#333333]">
                    {prod.nombre} <span className="text-[#888888]">x{prod.cantidad}</span>
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    ${(parseFloat(prod.precio) * prod.cantidad).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-baseline border-t border-border pt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-light">
                Total
              </span>
              <span className="text-2xl font-light">
                <span className="text-brand text-lg mr-1">$</span>
                {total.toLocaleString()}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
