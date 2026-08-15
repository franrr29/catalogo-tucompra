import { Link, useNavigate } from "react-router-dom";

function optimizarUrl(url) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/q_auto,f_auto,w_400/");
}

function Card({ producto, addCart, isLogIn }) {
  const navigate = useNavigate();
  const Wrapper = isLogIn ? "div" : Link;
  const wrapperProps = isLogIn ? {} : { to: `/producto/${producto.id}` };

  const tieneStock = Number(producto.stock) > 0;

  async function comprarAhora() {
    await addCart(producto.id);
    navigate("/checkout");
  }

  return (
    <div className="flex flex-col gap-2 font-sans group">
      {/* tarjeta de producto */}
      <Wrapper {...wrapperProps} className="block no-underline text-inherit">
        <div className="relative flex flex-col bg-white/35 backdrop-blur-xl backdrop-saturate-150 border border-white/50 rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out group-hover:bg-white/45 group-hover:border-white/70 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] active:scale-[0.98]">

          {/* contenedor de imagen */}
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/5 border-b border-white/40">
            {producto.imagen_url ? (
              <img
                src={optimizarUrl(producto.imagen_url)}
                alt={producto.nombre}
                loading="lazy"
                className="h-full w-full object-cover object-center group-hover:scale-[1.04] transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-black/5">
                <span className="text-[#888888] text-[10px] uppercase tracking-widest font-bold">
                  Sin imagen
                </span>
              </div>
            )}
          </div>

          {/* info del producto */}
          <div className="p-4 flex flex-col gap-3">

            {/* cabecera sutil */}
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-1.5">
              <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-muted">
                DETALLES
              </span>
            </div>

            {/* disponibilidad */}
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-2">
              <span className="text-[10px] font-bold text-muted-light uppercase tracking-wider">
                DISPONIBILIDAD
              </span>

              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-none ${
                    tieneStock ? "bg-emerald-600" : "bg-[#888888]"
                  }`}
                />
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#1A1A1A]">
                  {tieneStock ? `${producto.stock} EN STOCK` : "AGOTADO"}
                </span>
              </div>
            </div>

            {/* nombre del producto */}
            <div className="border-b border-[#1A1A1A]/15 pb-2">
              <h2 className="text-[#1A1A1A] font-bold text-xs uppercase tracking-wider leading-snug line-clamp-2 min-h-[2.25rem]">
                {producto.nombre}
              </h2>
            </div>

            {/* precio limpio con separacion */}
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-muted tracking-widest">
                PRECIO
              </span>

              <div className="flex items-center gap-2">
                {/* barra diagonal estetica */}
                <span className="text-brand font-bold text-sm">/</span>

                <div className="flex items-baseline">
                  <span className="text-sm font-sans font-bold text-brand mr-0.5">$</span>
                  <span className="font-sans font-black text-2xl tracking-tight text-[#1A1A1A] leading-none">
                    {Number(producto.precio).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </Wrapper>

      {/* botones de accion */}
      {!isLogIn && (
        <div className="flex flex-row gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              addCart(producto.id);
            }}
            disabled={!tieneStock}
            title={tieneStock ? "Agregar al carrito" : "Sin stock"}
            aria-label={tieneStock ? "Agregar al carrito" : "Sin stock"}
            className={`flex-1 h-11 rounded-lg flex items-center justify-center transition-all duration-200 border ${
              tieneStock
                ? "bg-ink-soft text-white border-[#1A1A1A] hover:bg-black hover:shadow-[0_4px_14px_rgba(0,0,0,0.35)] active:bg-black"
                : "bg-[#D1D1D1]/40 text-muted-lighter cursor-not-allowed border-[#D1D1D1]/60"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </button>

          {tieneStock && (
            <button
              onClick={(e) => {
                e.preventDefault();
                comprarAhora();
              }}
              title="Comprar ahora"
              aria-label="Comprar ahora"
              className="flex-1 h-11 rounded-lg flex items-center justify-center transition-all duration-200 border bg-brand text-white border-brand hover:bg-[#A3740A] hover:border-[#A3740A] hover:shadow-[0_4px_14px_rgba(200,146,17,0.35)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3M3.75 4.5h16.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5Z" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Card;