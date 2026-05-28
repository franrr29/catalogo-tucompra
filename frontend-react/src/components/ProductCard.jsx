import { Link } from "react-router-dom";

// reduce el peso de las imagenes de Cloudinary
function optimizarUrl(url) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/q_auto,f_auto,w_400/");
}

function Card({ producto, addCart, isLogIn }) {

  // si el admin esta logueado, la card no tiene link
  const Wrapper = isLogIn ? "div" : Link;
  const wrapperProps = isLogIn ? {} : { to: `/producto/${producto.id}` };

  return (
    <Wrapper {...wrapperProps} className="block group">

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col hover:border-zinc-700 transition-colors duration-200">

        {/* IMAGEN */}
        <div className="h-56 bg-zinc-800 overflow-hidden">
          {producto.imagen_url ? (
            <img
              src={optimizarUrl(producto.imagen_url)}
              alt={producto.nombre}
              loading="lazy"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-zinc-600 text-xs uppercase tracking-widest">Sin imagen</span>
          )}
        </div>

        {/* CONTENIDO */}
        <div className="p-5 flex flex-col gap-4 flex-grow">

          {/* NOMBRE */}
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide leading-snug">
            {producto.nombre}
          </h2>

          {/* PRECIO Y STOCK */}
          <div className="flex items-center justify-between">
            <p className="text-amber-500 text-2xl font-bold">
              ${Number(producto.precio).toLocaleString()}
            </p>
            <span className="text-zinc-500 text-xs">{producto.stock} u.</span>
          </div>

          {/* BOTON */}
          {!isLogIn && (
            <button
              onClick={(e) => {
                e.preventDefault();
                addCart(producto.id);
              }}
              className="mt-auto w-full py-3 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-amber-500 hover:text-white transition-colors duration-200"
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
