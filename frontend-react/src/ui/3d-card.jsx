import { CardBody, CardContainer, CardItem } from "./card-3d";

export function ThreeDCardDemo({ producto }) {
  // Manejo de carga: si el fetch de ProductoDetalle no terminó, mostramos algo básico
  if (!producto || !producto.nombre) {
    return (
      <div className="flex justify-center items-center p-20">
        <div className="text-white uppercase tracking-[0.3em] text-[10px] animate-pulse">
          Cargando producto...
        </div>
      </div>
    );
  }

  return (
    <CardContainer className="inter-var">
      <CardBody className="bg-[#0a0a0a] relative group/card border-white/10 w-auto sm:w-[30rem] h-auto rounded-xl p-6 border shadow-2xl transition-colors duration-500 hover:border-amber-500/30">
        
        {/* Nombre del producto */}
        <CardItem 
          translateZ="50" 
          className="text-xl font-bold text-white tracking-widest uppercase"
        >
          {producto.nombre}
        </CardItem>
        
        {/* Precio */}
        <CardItem 
          as="p" 
          translateZ="60" 
          className="text-gray-400 text-sm max-w-sm mt-2 font-light"
        >
          Precio: <span className="text-amber-500 font-bold ml-1">${producto.precio}</span>
        </CardItem>

        {/* Imagen con efecto de profundidad máximo */}
        <CardItem translateZ="100" className="w-full mt-4">
          <img
            /* USAMOS imagen_url PORQUE VIENE DE CLOUDINARY SEGÚN TU BACKEND */
            src={producto.imagen_url || "https://via.placeholder.com/400x300?text=Sin+Imagen"}
            className="h-60 w-full object-cover rounded-xl group-hover/card:shadow-xl border border-white/5"
            alt={producto.nombre}
            /* Si la URL de Cloudinary falla, ponemos una imagen de error */
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/400x300?text=Error+al+cargar+imagen";
            }}
          />
        </CardItem>

        {/* Botones y Stock */}
        <div className="flex justify-between items-center mt-10">
          <CardItem 
            translateZ={20} 
            className="px-4 py-2 rounded-xl text-[10px] font-medium text-gray-400 tracking-widest uppercase"
          >
            Stock: <span className="text-white ml-1">{producto.stock} uds</span>
          </CardItem>
          
          <CardItem
            translateZ={20}
            as="button"
            className="px-6 py-2 rounded-sm bg-white text-black text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-amber-500 transition-all duration-500 active:scale-95"
          >
            Añadir al carrito
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  );
}

export default ThreeDCardDemo;