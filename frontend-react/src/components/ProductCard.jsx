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
    <div className="flex flex-col gap-3 group">
      {/* TARJETA BLANCA TOTALMENTE RECTA Y PLANA */}
      <Wrapper {...wrapperProps} className="block">
        <div className="relative flex flex-col bg-white overflow-hidden border rounded-sm border-white/10 group-hover:shadow-lg group-hover:shadow-amber-500/20 transition-all duration-300">          
          {/* CONTENEDOR DE IMAGEN */}
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
            {producto.imagen_url ? (
              <img
                src={optimizarUrl(producto.imagen_url)}
                alt={producto.nombre}
                loading="lazy"
                className="h-full w-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300 ease-out"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-neutral-100">
                <span className="text-neutral-400 text-[11px] uppercase tracking-[0.2em] font-medium">
                  Sin imagen
                </span>
              </div>
            )}
          </div>

          {/* INFORMACIÓN DEL PRODUCTO */}
          <div className="p-5 flex flex-col gap-3 bg-white">
            
            {/* DISPONIBILIDAD */}
            <div className="flex items-center gap-2">
              <span 
                className={`w-1.5 h-1.5 ${
                  tieneStock ? "bg-amber-600" : "bg-neutral-300"
                }`} 
              />
              <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-neutral-500">
                {tieneStock ? `${producto.stock} disponibles` : "Agotado"}
              </span>
            </div>

            {/* NOMBRE DEL PRODUCTO */}
            <h2 className="text-neutral-900 font-semibold text-sm uppercase tracking-[0.08em] leading-snug line-clamp-2 min-h-[2.5rem]">
              {producto.nombre}
            </h2>

            {/* PRECIO */}
            <div>
              <p className="text-neutral-950 text-2xl font-light tracking-tight">
                ${Number(producto.precio).toLocaleString()}
              </p>
            </div>

          </div>
        </div>
      </Wrapper>

      {/* BOTÓN FUERA DEL CARD (RECTO, NEGRO MATE) */}
      {!isLogIn && (
       <button
  onClick={(e) => {
    e.preventDefault();
    addCart(producto.id);
  }}
  className="w-full h-12 bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition hover:bg-slate-800 active:scale-95"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4 text-amber-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
  </svg>

  <span>Agregar al carrito</span>
</button>
      )}
    </div>
  );
}

export default Card;