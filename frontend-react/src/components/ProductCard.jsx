import { Link } from "react-router-dom";

function optimizarUrl(url) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/q_auto,f_auto,w_400/");
}

function Card({ producto, addCart, isLogIn }) {

  const Wrapper = isLogIn ? "div" : Link;
  const wrapperProps = isLogIn ? {} : { to: `/producto/${producto.id}` };

  return (
    <Wrapper {...wrapperProps} className="block group">

      <div className="rounded-2xl overflow-hidden flex flex-col bg-zinc-900 hover:scale-[1.02] transition-transform duration-300">

        {/* IMAGEN */}
        <div className="aspect-[3/4] overflow-hidden">
          {producto.imagen_url ? (
            <img
              src={optimizarUrl(producto.imagen_url)}
              alt={producto.nombre}
              loading="lazy"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-zinc-800">
              <span className="text-zinc-600 text-xs uppercase tracking-widest">Sin imagen</span>
            </div>
          )}
        </div>

        {/* INFO - se monta encima de la imagen con bordes redondeados arriba */}
        <div className="-mt-5 rounded-t-2xl relative z-10 p-4 flex flex-col gap-3 bg-zinc-900">

          {/* NOMBRE + STOCK */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-white font-bold text-sm uppercase tracking-wide leading-snug">
                {producto.nombre}
              </h2>
            </div>
            <span className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full shrink-0">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {producto.stock} disponibles
            </span>
          </div>

          {/* DIVISOR */}
          <div className="h-px bg-white/10" />

          {/* PRECIO */}
          <p className="text-amber-500 text-3xl font-bold">
            ${Number(producto.precio).toLocaleString()}
          </p>

          {/* BOTON */}
          {!isLogIn && (
            <button
              onClick={(e) => {
                e.preventDefault();
                addCart(producto.id);
              }}
              className="w-full py-3 bg-gradient-to-b from-yellow-400 via-amber-500 to-orange-600 text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:from-yellow-300 hover:via-amber-400 hover:to-orange-500 transition-all duration-200 flex items-center justify-center gap-3 shadow-[0_2px_12px_rgba(245,158,11,0.35)]"
            >
              <span className="text-xl leading-none font-bold">+</span>
              Agregar al carrito
            </button>
          )}

        </div>
      </div>

    </Wrapper>
  );
}

export default Card;
