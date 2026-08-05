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
        <p className="text-zinc-500 text-xs tracking-[0.2em] uppercase">Cargando...</p>
      </div>
    );
  }

  const tieneStock = Number(producto.stock) > 0;

  return (
    <div className="min-h-screen bg-black text-[#f4f1ea] pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">

          {/* GALERÍA / CARRUSEL */}
          <div className="aspect-square rounded-sm overflow-hidden bg-zinc-900 border border-zinc-800">
            <Swiper
              modules={[Navigation, Pagination]}
              navigation={true}
              pagination={{ clickable: true }}
              className="h-full w-full"
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

          {/* PANEL DE INFORMACIÓN */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-sm p-6 flex flex-col gap-6">

            {/* ENCABEZADO */}
            <div>
              <h1 className="text-white font-semibold text-xl uppercase tracking-wide leading-snug">
                {producto.nombre}
              </h1>
              <p className="text-amber-400 text-3xl font-light tracking-tight mt-3">
                ${producto.precio?.toLocaleString()}
              </p>
            </div>

            <div className="h-px bg-zinc-800" />

            {/* DISPONIBILIDAD */}
            <div className="flex items-center gap-2.5">
              <span 
                className={`w-2 h-2 rounded-full ${
                  tieneStock ? "bg-emerald-500" : "bg-zinc-600"
                }`} 
              />
              <span className="text-xs font-medium tracking-wide uppercase text-zinc-400">
                {tieneStock ? `${producto.stock} unidades disponibles` : "Agotado"}
              </span>
            </div>

            {/* DETALLES */}
            <div className="text-xs text-zinc-400 space-y-1.5 leading-relaxed">
              <p>• Envíos a todo el país.</p>
              <p>• Garantía oficial de tienda.</p>
            </div>

            {/* BOTÓN CTA */}
            <button
              onClick={() => addCart(producto.id)}
              disabled={!tieneStock}
              className="w-full h-12 bg-[#0f172a] border border-slate-800 text-white text-xs font-medium uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-colors hover:bg-[#1e293b] active:bg-[#020617] disabled:bg-zinc-800 disabled:border-transparent disabled:text-zinc-600 disabled:cursor-not-allowed mt-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 stroke-[2] opacity-80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>

              <span>Agregar al carrito</span>
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

export default ProductoDetalle;