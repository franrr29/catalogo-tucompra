import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { API_URL } from "../config";

function ProductoDetalle({ addCart }) {
  const [producto, setProducto] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const res = await fetch(`${API_URL}/api/productos/${id}`);
        const data = await res.json();
        setProducto(data);
      } catch (error) {
        console.error("Error al cargar producto:", error);
      }
    };
    cargarDatos();
  }, [id]);

  if (!producto) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/40 text-xs tracking-[0.5em] uppercase animate-pulse">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          {/* IMAGEN - cuadrada con carrusel */}
          <div className="aspect-square rounded-xl overflow-hidden border border-white/10">
            <Swiper
              modules={[Navigation, Pagination]}
              navigation={true}
              pagination={{ clickable: true }}
              className="h-full w-full mySwiper"
            >
              {!producto.imagenes || producto.imagenes.length === 0 ? (
                <SwiperSlide className="flex items-center justify-center bg-zinc-900">
                  <p className="text-zinc-600 text-xs uppercase tracking-widest">Sin imagen</p>
                </SwiperSlide>
              ) : (
                producto.imagenes.map((imagen, index) => (
                  <SwiperSlide key={index} className="bg-zinc-900">
                    <img
                      src={imagen.url}
                      alt={`${producto.nombre} - ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </SwiperSlide>
                ))
              )}
            </Swiper>
          </div>

          {/* CONTENIDO - mismo estilo glass que los cards */}
          <div className="rounded-xl border border-white/10 backdrop-blur-md bg-zinc-400/10 p-6 flex flex-col gap-6">

            {/* NOMBRE */}
            <h1 className="text-white font-bold text-xl uppercase tracking-wide leading-snug">
              {producto.nombre}
            </h1>

            <div className="h-px bg-white/10" />

            {/* PRECIO */}
            <p className="text-white text-4xl font-bold">
              ${producto.precio?.toLocaleString()}
            </p>

            {/* DISPONIBILIDAD */}
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <p className="text-zinc-300 text-sm">
                {producto.stock} disponibles
              </p>
            </div>

            {/* ENVIO */}
            <p className="text-zinc-500 text-sm">
              Envios a todo el pais.
            </p>

            {/* BOTON */}
            <button
              onClick={() => addCart(producto.id)}
              className="w-full py-4 bg-amber-500 text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-colors duration-200"
            >
              Agregar al carrito
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductoDetalle;
