import { Link } from "react-router-dom";

// reduce el peso de las imagenes de Cloudinary
function optimizarUrl(url) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/q_auto,f_auto,w_400/");
}

function Card({ producto, addCart, isLogIn }) {

  // si el admin esta logueado, la card no navega al producto
  const Wrapper = isLogIn ? "div" : Link;
  const wrapperProps = isLogIn ? {} : { to: `/producto/${producto.id}` };

  return (
    <Wrapper {...wrapperProps} className="block group">

      <div className="rounded-2xl overflow-hidden flex flex-col backdrop-blur-md bg-white/5 border border-white/10 hover:border-white/25 transition-all duration-300">

        {/* IMAGEN - cuadrada, llena el espacio */}
        <div className="aspect-square overflow-hidden">
          {producto.imagen_url ? (
            <img
              src={optimizarUrl(producto.imagen_url)}
              alt={producto.nombre}
              loading="lazy"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-white/5">
              <span className="text-zinc-600 text-xs uppercase tracking-widest">Sin imagen</span>
            </div>
          )}
        </div>

        {/* DIVISOR */}
        <div className="h-px bg-white/10" />

        {/* CONTENIDO */}
        <div className="p-5 flex flex-col gap-4">

          {/* NOMBRE */}
          <h2 className="text-white font-bold text-sm uppercase tracking-wide leading-snug">
            {producto.nombre}
          </h2>

          {/* PRECIO Y STOCK */}
          <div className="flex items-center justify-between">
            <p className="text-white text-2xl font-bold">
              ${Number(producto.precio).toLocaleString()}
            </p>
            <span className="text-zinc-400 text-xs">{producto.stock} u.</span>
          </div>

          {/* BOTON */}
          {!isLogIn && (
            <button
              onClick={(e) => {
                e.preventDefault();
                addCart(producto.id);
              }}
              className="w-full py-3 bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-amber-500 hover:border-amber-500 hover:text-black transition-all duration-200"
            >
              Agregar al carrito
            </button>
          )}

        </div>
      </div>

    </Wrapper>
  );
}

export default Card;
