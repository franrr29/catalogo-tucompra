import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_URL } from "../config";

function ProductoDetalle({ addCart }) {
  const [producto, setProducto] = useState(null);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(0);
  const { id } = useParams();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const res = await fetch(`${API_URL}/api/productos/${id}`);
        const data = await res.json();
        setProducto(data);
        setImagenSeleccionada(0);
      } catch (error) {
        console.error("Error al cargar producto:", error);
      }
    };
    cargarDatos();
  }, [id]);

  if (!producto) {
    return (
      <div className="min-h-screen bg-[#F7F7F6] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-4 h-4 bg-[#C89211] animate-ping" />
          <p className="text-[#666666] text-xs tracking-widest uppercase">Cargando...</p>
        </div>
      </div>
    );
  }

  const tieneStock = Number(producto.stock) > 0;
  const imagenes = producto.imagenes || [];

  return (
    <div className="min-h-screen bg-[#F7F7F6] text-[#1A1A1A] font-mono pt-28 pb-16 px-6 sm:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">

          {/* galeria: imagen un 30% mas grande (col-span-7) */}
          <div className="md:col-span-7 flex flex-col gap-3">
            {/* visor principal */}
            <div className="relative aspect-square w-full overflow-hidden bg-[#E5E5E5] border-[0.5px] border-[#1A1A1A]/20">
              {imagenes.length > 0 ? (
                <img
                  src={imagenes[imagenSeleccionada]?.url}
                  alt={`${producto.nombre} - ${imagenSeleccionada + 1}`}
                  className="h-full w-full object-cover object-center transition-all duration-300"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-[#E5E5E5]">
                  <span className="text-[#888888] text-[10px] uppercase tracking-widest font-bold">
                    Sin imagen
                  </span>
                </div>
              )}
            </div>

            {/* tira de miniaturas */}
            {imagenes.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imagenes.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setImagenSeleccionada(index)}
                    className={`relative w-16 h-16 flex-shrink-0 bg-[#E5E5E5] border transition-all duration-200 overflow-hidden ${
                      imagenSeleccionada === index
                        ? "border-2 border-[#1A1A1A] opacity-100"
                        : "border-[0.5px] border-[#1A1A1A]/20 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Vista ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* columna de informacion estilizada (listado tecnico) */}
          <div className="md:col-span-5 flex flex-col gap-6">

            {/* cabecera del producto */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-[#666666] uppercase">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-none ${
                      tieneStock ? "bg-emerald-600" : "bg-[#888888]"
                    }`}
                  />
                  <span>{tieneStock ? `${producto.stock} EN STOCK` : "AGOTADO"}</span>
                </div>
              </div>

              <h1 className="text-[#1A1A1A] font-sans font-black text-3xl uppercase tracking-tight leading-tight mt-1">
                {producto.nombre}
              </h1>
            </div>

            {/* desglose de datos en formato tabla/lista lineal */}
            <div className="border-t-2 border-b-2 border-[#1A1A1A] divide-y divide-[#D1D1D1]">
              <div className="py-3 flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#777777] uppercase tracking-widest">PRECIO UNITARIO</span>
                <p className="font-sans font-black text-2xl tracking-tight text-[#1A1A1A]">
                  <span className="text-sm font-bold text-[#C89211] mr-0.5">$</span>
                  {producto.precio?.toLocaleString()}
                </p>
              </div>

              <div className="py-2.5 flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#777777] uppercase tracking-widest text-[10px]">ENVIO</span>
                <span className="font-bold text-[#1A1A1A] uppercase tracking-wider">A TODO EL PAIS</span>
              </div>

              <div className="py-2.5 flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#777777] uppercase tracking-widest text-[10px]">GARANTIA</span>
                <span className="font-bold text-[#1A1A1A] uppercase tracking-wider">OFICIAL DE TIENDA</span>
              </div>
            </div>

            {/* boton de agregar al carrito */}
            <button
              onClick={() => addCart(producto.id)}
              disabled={!tieneStock}
              className={`w-full h-12 text-xs font-bold uppercase tracking-widest rounded-none flex items-center justify-center gap-2 transition-colors duration-200 border-[0.5px] ${
                tieneStock
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A] hover:bg-[#C89211] hover:border-[#C89211] active:bg-[#A3740A]"
                  : "bg-[#D1D1D1] text-[#888888] cursor-not-allowed border-[#D1D1D1]"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-[#C89211] group-hover:text-white transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="square" strokeLinejoin="miter" d="M12 5v14M5 12h14" />
              </svg>

              <span>{tieneStock ? "Agregar al carrito" : "Sin Stock"}</span>
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

export default ProductoDetalle;