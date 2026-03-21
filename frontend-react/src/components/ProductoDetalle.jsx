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
        <p className="text-white tracking-[0.3em] font-light animate-pulse uppercase text-xs">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-12 px-6 flex items-center justify-center">      
      {/* CONTENEDOR PRINCIPAL: Glassmorphism Brillante */}
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-center bg-white/5 backdrop-blur-xl border border-white/10 border-t-white/20 p-8 md:p-12 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* IZQUIERDA: Slider de Imágenes */}
        <div className="w-full aspect-square md:h-[550px] overflow-hidden rounded-xl bg-neutral-900/50 relative group border border-white/5">
          <Swiper 
            modules={[Navigation, Pagination]} 
            navigation={true}
            pagination={{ clickable: true }}
            className="h-full w-full mySwiper"
          >
            {!producto.imagenes || producto.imagenes.length === 0 ? (
              <SwiperSlide className="flex items-center justify-center">
                <p className="text-neutral-500 tracking-widest text-xs uppercase">Sin imagen disponible</p>
              </SwiperSlide>
            ) : (
              producto.imagenes.map((imagen, index) => (
                <SwiperSlide key={index} className="flex items-center justify-center bg-transparent">
                  <img
                    src={imagen.url}
                    alt={`${producto.nombre} - ${index}`}
                    className="object-contain h-full w-full p-4 transition-transform duration-700 hover:scale-105"
                  />
                </SwiperSlide>
              ))
            )}
          </Swiper>
        </div> 

        {/* DERECHA: Información */}
        <div className="flex flex-col space-y-8">
          <header className="space-y-3">
            <span className="text-[10px] uppercase tracking-[0.5em] text-amber-500 font-medium">Colección Exclusiva</span>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-tight uppercase">
              {producto.nombre}
            </h1>
          </header>

          {/* Línea divisoria elegante */}
          <div className="h-px bg-gradient-to-r from-amber-500/40 via-white/10 to-transparent w-full" />

          <div className="space-y-2">
            <p className="text-4xl font-extralight tracking-tighter">
              <span className="text-amber-500 text-xl mr-2">$</span>
              {producto.precio?.toLocaleString()}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
              <p className="text-[11px] text-neutral-400 uppercase tracking-widest">
                Stock: <span className="text-white font-medium">{producto.stock} disponibles</span>
              </p>
            </div>
          </div>

          <p className="text-sm text-neutral-400 leading-relaxed font-light max-w-md">
           Envíos a todo el país
          </p>

          <div className="pt-4">
            {/* BOTÓN: Ámbar sólido, texto blanco, sin sombras exteriores */}
            <button 
              onClick={() => addCart(producto.id)}
              className="w-full py-4 bg-amber-500 text-white text-xs uppercase tracking-[0.3em] font-bold rounded-lg hover:bg-amber-400 transition-all duration-300 active:scale-[0.97]"
            >
              Añadir al Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductoDetalle;