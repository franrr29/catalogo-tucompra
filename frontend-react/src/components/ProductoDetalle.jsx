import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

function ProductoDetalle({ addCart }) {
  const [producto, setProducto] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/productos/${id}`);
        const data = await res.json();
        setProducto(data);
      } catch (error) {
        console.error("Error al cargar producto:", error);
      }
    };
    cargarDatos();
  }, [id]);
  console.log (producto)

  if (!producto) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white tracking-[0.3em] font-light animate-pulse">LOADING</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
      {/* Contenedor Principal con Estética Glassmorphism */}
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl shadow-2xl">
        
        {/* Columna Izquierda: Slider de Imágenes */}
        <div className="w-full h-[500px] overflow-hidden rounded-xl bg-neutral-900 group">
          <Swiper 
            modules={[Navigation, Pagination]} 
            navigation={true}
            pagination={{ clickable: true }}
            className="h-full w-full"
          >
            {producto.imagenes.map((url, index) => (
              <SwiperSlide key={index} className="flex items-center justify-center">
                <img 
                  src={url} 
                  alt={`Vista ${index}`} 
                  className="object-contain h-full w-full transition-transform duration-500 group-hover:scale-105"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Columna Derecha: Información del Producto */}
        <div className="flex flex-col space-y-6">
          <header className="space-y-2">
            <span className="text-xs uppercase tracking-[0.4em] text-neutral-500 font-medium">Detalles del Producto</span>
            <h1 className="text-4xl font-light tracking-tight">{producto.nombre}</h1>
          </header>

          <div className="h-px bg-gradient-to-r from-white/20 to-transparent w-full" />

          <div className="space-y-4">
            <p className="text-3xl font-extralight">${producto.precio}</p>
            <p className="text-sm text-neutral-400 leading-relaxed font-light">
              Disponibles: <span className="text-white">{producto.stock} unidades</span>
            </p>
          </div>

          <div className="pt-6">
            <button 
              onClick={() => addCart(producto.id)}
              className="w-full py-4 bg-amber-500 text-white text-sm uppercase tracking-[0.2em] font-semibold hover:bg-amber-600 transition-colors duration-300 active:scale-[0.98] "            >
              Añadir al Carrito
            </button>
          </div>

          <footer className="pt-4">
            <p className="text-[10px] text-neutral-600 uppercase tracking-widest text-center">
              Diseño Premium
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default ProductoDetalle;