import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ThreeDCardDemo } from "../ui/3d-card"; 

function ProductoDetalle() {
  const [producto, setProducto] = useState(null);
  const [fotoActual, setFotoActual] = useState(""); 
  const { id } = useParams();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/productos/${id}`);
        const data = await res.json();
        
        setProducto(data);
        
        // Seteamos la primera imagen del array como la principal para el componente 3D
        if (data.imagenes && data.imagenes.length > 0) {
          setFotoActual(data.imagenes[0]);
        }
      } catch (error) {
        console.error("Error al cargar producto:", error);
      }
    };
    cargarDatos();
  }, [id]);

  // Si el producto no ha cargado, evitamos que el resto del código falle
  if (!producto) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white tracking-[0.2em] animate-pulse">CARGANDO...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 gap-8">
      <div className="w-full flex justify-center">
        <ThreeDCardDemo producto={{ ...producto, imagen_url: fotoActual }} />
      </div>

      {/* Galería de miniaturas (las 3 imágenes) */}
      <div className="flex gap-4">
        {producto.imagenes && producto.imagenes.map((url, index) => (
          <button 
            key={index} 
            onClick={() => setFotoActual(url)}
            className={`transition-all duration-300 p-1 border ${
              fotoActual === url 
              ? 'border-amber-500 bg-amber-500/10 scale-110 shadow-lg shadow-amber-500/20' 
              : 'border-white/10 opacity-40 hover:opacity-100 hover:border-white/30'
            }`}
          >
            <img 
              src={url} 
              alt={`Vista ${index}`} 
              className="w-16 h-16 object-contain bg-neutral-900" 
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProductoDetalle;