import { Link } from "react-router-dom";

function optimizarUrl(url) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/q_auto,f_auto,w_400/");
}

function Card({ producto, addCart, isLogIn }) {
  const Wrapper = isLogIn ? "div" : Link;
  const wrapperProps = isLogIn ? {} : { to: `/producto/${producto.id}` };

  const tieneStock = Number(producto.stock) > 0;

  return (
    <div className="flex flex-col gap-2 font-sans group">
      {/* tarjeta de producto */}
      <Wrapper {...wrapperProps} className="block no-underline text-inherit">
        <div className="relative flex flex-col bg-[#E5E5E5] border-[0.5px] border-[#1A1A1A]/20 rounded-none overflow-hidden transition-transform duration-150 active:scale-[0.98]">

          {/* contenedor de imagen */}
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#DEDEDE] border-b-[0.5px] border-[#1A1A1A]/20">
            {producto.imagen_url ? (
              <img
                src={optimizarUrl(producto.imagen_url)}
                alt={producto.nombre}
                loading="lazy"
                className="h-full w-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300 ease-out"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-[#DEDEDE]">
                <span className="text-[#888888] text-[10px] uppercase tracking-widest font-bold">
                  Sin imagen
                </span>
              </div>
            )}
          </div>

          {/* info del producto */}
          <div className="p-3.5 flex flex-col bg-[#E5E5E5] gap-2.5">

            {/* cabecera sutil */}
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-1.5">
              <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#666666]">
                DETALLES
              </span>
            </div>

            {/* disponibilidad */}
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-2">
              <span className="text-[10px] font-bold text-[#777777] uppercase tracking-wider">
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

            {/* precio limpio con separacion / */}
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-[#666666] tracking-widest">
                PRECIO
              </span>

              <div className="flex items-center gap-2">
                {/* barra diagonal estetica */}
                <span className="text-[#C89211] font-bold text-sm">/</span>

                <div className="flex items-baseline">
                  <span className="text-sm font-sans font-bold text-[#C89211] mr-0.5">$</span>
                  <span className="font-sans font-black text-2xl tracking-tight text-[#1A1A1A] leading-none">
                    {Number(producto.precio).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </Wrapper>

      {/* boton de accion */}
      {!isLogIn && (
        <button
          onClick={(e) => {
            e.preventDefault();
            addCart(producto.id);
          }}
          disabled={!tieneStock}
          className={`w-full h-11 text-xs font-bold uppercase tracking-widest rounded-none flex items-center justify-center gap-2 transition-colors duration-200 border-[0.5px] ${
            tieneStock
              ? "bg-[#1A1A1A] text-white border-[#1A1A1A] hover:bg-[#C89211] hover:border-[#C89211] active:bg-[#A3740A]"
              : "bg-[#D1D1D1] text-[#888888] cursor-not-allowed border-[#D1D1D1]"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5 text-[#C89211] group-hover:text-white transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="square" strokeLinejoin="miter" d="M12 5v14M5 12h14" />
          </svg>

          <span>{tieneStock ? "Agregar al carrito" : "Sin Stock"}</span>
        </button>
      )}
    </div>
  );
}

export default Card;