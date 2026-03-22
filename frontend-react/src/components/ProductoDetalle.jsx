import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { motion } from "framer-motion"; // Agregado para el fade inicial
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
        <p className="text-white tracking-[0.5em] font-light animate-pulse uppercase text-[10px]">Cargando producto</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-6 flex flex-col items-center justify-start overflow-y-auto selection:bg-amber-500/30"> 
        
        {/* EFECTO DE LUZ AMBIENTAL EN EL FONDO */}
        <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 blur-[120px] rounded-full" />
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-start bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-8 md:p-16 rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.7)] relative z-10"
        >
        
        {/* IZQUIERDA: Slider de Imágenes */}
        <div className="w-full aspect-square md:h-[500px] overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent relative group border border-white/5">
          <Swiper 
            modules={[Navigation, Pagination]} 
            navigation={true}
            pagination={{ clickable: true }}
            className="h-full w-full mySwiper"
          >
            {!producto.imagenes || producto.imagenes.length === 0 ? (
              <SwiperSlide className="flex items-center justify-center">
                <p className="text-neutral-600 tracking-[0.3em] text-[10px] uppercase">Sin imagen disponible</p>
              </SwiperSlide>
            ) : (
              producto.imagenes.map((imagen, index) => (
                <SwiperSlide key={index} className="flex items-center justify-center bg-transparent">
                  <img
                    src={imagen.url}
                    alt={`${producto.nombre} - ${index}`}
                    className="object-contain h-full w-full p-8 transition-transform duration-1000 ease-out hover:scale-110"
                  />
                </SwiperSlide>
              ))
            )}
          </Swiper>
        </div> 

        {/* DERECHA: Información */}
        <div className="flex flex-col space-y-10 py-4">
          <header className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="h-[1px] w-8 bg-amber-500/50" />
                <span className="text-[9px] uppercase tracking-[0.6em] text-amber-500 font-bold">Colección Exclusiva</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-light tracking-tighter leading-[1.1] uppercase italic-none">
              {producto.nombre}
            </h1>
          </header>

          {/* Línea divisoria elegante */}
          <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent w-full" />

          <div className="space-y-4">
            <div className="space-y-1">
                <span className="text-[11px] text-neutral-500 uppercase tracking-[0.4em]">Precio</span>
                <p className="text-5xl font-extralight tracking-tighter flex items-start">
                  <span className="text-amber-500 text-xl mt-1 mr-2">$</span>
                  {producto.precio?.toLocaleString()}
                </p>
            </div>

            <div className="flex items-center gap-4 pt-4 ">
              {/* Luz verde que titila */}
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
              <p className="text-[10px] text-neutral-300 uppercase tracking-[0.2em]">
                 Disponibles: <span className="text-white font-bold">{producto.stock}</span>
              </p>
            </div>
          </div>

          <div className="space-y-6">
              <p className="text-[14px] text-neutral-400 leading-relaxed font-light max-w-sm tracking-wide border-l border-amber-500/30 pl-4">
                Envíos a todo el pais.
              </p>

              <div className="pt-6">
                {/* BOTÓN: Ámbar sólido, estilo Apple Premium */}
                <button 
                  onClick={() => addCart(producto.id)}
                  className="w-full py-5 bg-white text-black text-[10px] uppercase tracking-[0.4em] font-black rounded-full hover:bg-amber-500 hover:text-white transition-all duration-500 active:scale-[0.98] shadow-2xl"
                >
                  Agregar al carrito
                </button>
              </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ProductoDetalle;