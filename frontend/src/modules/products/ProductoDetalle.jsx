import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { obtenerProducto } from "../../services/productos.service";
import { DESCRIPCION_POR_DEFECTO } from "./descripcionPorDefecto";

function ProductoDetalle({ addCart }) {
  const [producto, setProducto] = useState(null);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(0);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const data = await obtenerProducto(id);
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
      <div className="min-h-screen bg-[#F7F7F6] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-4 h-4 bg-brand animate-ping" />
          <p className="text-muted text-xs tracking-widest uppercase">Cargando...</p>
        </div>
      </div>
    );
  }

  const tieneStock = Number(producto.stock) > 0;
  const imagenes = producto.imagenes || [];
  // si el admin no cargo una descripcion se usa el texto general de los relojes
  const descripcion = producto.descripcion?.trim() || DESCRIPCION_POR_DEFECTO;

  async function comprarAhora() {
    await addCart(producto.id);
    navigate("/checkout");
  }

  return (
    <div className="min-h-screen bg-[#F7F7F6] text-[#1A1A1A] font-sans pt-28 pb-16 px-6 sm:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-2xl border border-[#1A1A1A]/15 bg-white/40 backdrop-blur-md p-6 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-10 items-start">

          {/* galeria de imagenes un poco mas grande */}
          <div className="md:col-span-7 flex flex-col gap-3">
            {/* visor principal */}
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#E5E5E5] border-[0.5px] border-[#1A1A1A]/20">
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
                    className={`relative w-16 h-16 flex-shrink-0 rounded-lg bg-[#E5E5E5] border transition-all duration-200 overflow-hidden ${
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

          {/* columna de informacion estilizada */}
          <div className="md:col-span-5 flex flex-col gap-6">

            {/* cabecera del producto */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-muted uppercase">
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

            {/* desglose de datos en formato de lista */}
            <div className="border-t-2 border-b-2 border-[#1A1A1A] divide-y divide-[#CCCCCC]">
              <div className="py-3 flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-light uppercase tracking-widest">PRECIO UNITARIO</span>
                <p className="font-sans font-black text-2xl tracking-tight text-[#1A1A1A]">
                  <span className="text-sm font-bold text-brand mr-0.5">$</span>
                  {producto.precio?.toLocaleString()}
                </p>
              </div>

              <div className="py-2.5 flex items-center justify-between text-[11px]">
                <span className="font-bold text-muted-light uppercase tracking-widest text-[10px]">ENVIO</span>
                <span className="font-bold text-[#1A1A1A] uppercase tracking-wider">A TODO EL PAIS</span>
              </div>

              <div className="py-2.5 flex items-center justify-between text-[11px]">
                <span className="font-bold text-muted-light uppercase tracking-widest text-[10px]">GARANTIA</span>
                <span className="font-bold text-[#1A1A1A] uppercase tracking-wider">OFICIAL DE TIENDA</span>
              </div>
            </div>

            {/* botones de accion */}
            <div className="flex flex-row gap-2">
              <button
                onClick={() => addCart(producto.id)}
                disabled={!tieneStock}
                title={tieneStock ? "Agregar al carrito" : "Sin stock"}
                aria-label={tieneStock ? "Agregar al carrito" : "Sin stock"}
                className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all duration-200 border ${
                  tieneStock
                    ? "bg-ink-soft text-white border-[#1A1A1A] hover:bg-black hover:shadow-[0_4px_14px_rgba(0,0,0,0.35)] active:bg-black"
                    : "bg-[#D1D1D1]/40 text-muted-lighter cursor-not-allowed border-[#D1D1D1]/60"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </button>

              {tieneStock && (
                <button
                  onClick={comprarAhora}
                  title="Comprar ahora"
                  aria-label="Comprar ahora"
                  className="flex-1 h-12 rounded-xl flex items-center justify-center transition-all duration-200 border bg-brand text-white border-brand hover:bg-[#A3740A] hover:border-[#A3740A] hover:shadow-[0_4px_14px_rgba(200,146,17,0.35)]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3M3.75 4.5h16.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5Z" />
                  </svg>
                </button>
              )}
            </div>

            {/* descripcion del producto */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-muted-light uppercase tracking-widest">
                DESCRIPCION
              </span>
              <p className="text-sm leading-7 text-[#1A1A1A] whitespace-pre-line">
                {descripcion}
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default ProductoDetalle;
