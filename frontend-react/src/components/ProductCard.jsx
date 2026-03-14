import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function Card({ producto, addCart, isLogIn }) {
    return (
        <Link to={`/producto/${producto.id}`}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                whileHover={{ y: -8, borderColor: "rgba(245, 210, 11, 0.4)" }} 
                className="bg-[#0a0a0a] border border-white/5 rounded-sm p-6 flex flex-col gap-4 transition-all duration-500 group shadow-2xl"
            >
                {/* Cabecera: Nombre */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-white font-light text-sm tracking-[0.2em] uppercase group-hover:text-amber-500 transition-colors duration-300">
                        {producto.nombre}
                    </h1>
                    <div className="h-[1px] w-8 bg-amber-500/50 group-hover:w-full transition-all duration-700" />
                </div>

                {/* Contenedor de Imagen */}
                <div className="relative w-full overflow-hidden bg-neutral-900/30 flex items-center justify-center">
    <img 
        src={producto.imagen_url || "https://via.placeholder.com/300x300?text=Sin+Imagen"} 
        alt={producto.nombre}
        /* 1. Quitamos la altura fija del div anterior (h-48) para que el div 
              tenga la altura real de la foto.
           2. Usamos w-full para que ocupe todo el ancho.
           3. Usamos object-contain para asegurar que no se corte NADA.
        */
        className="w-full h-auto max-h-[300px] object-contain transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
        onError={(e) => {
            e.target.src = "https://via.placeholder.com/300x300?text=Error+en+URL";
        }}
    />
</div>

                {/* Precio */}
                <p className="text-2xl font-bold text-white tracking-tight">
                    <span className="text-amber-500 text-sm font-light mr-1">$</span>
                    {producto.precio.toLocaleString()}
                </p>

                {/* Stock */}
                <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-[10px] text-gray-500 tracking-[0.15em] uppercase">
                        Unidades: {producto.stock}
                    </p>
                </div>

                {/* Botón */}
                {!isLogIn && (
                    <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.preventDefault(); 
                            addCart(producto.id);
                        }}
                        className="mt-4 border border-white/10 text-white text-[10px] tracking-[0.2em] uppercase px-4 py-3 hover:bg-white hover:text-black hover:border-white transition-all duration-500 font-medium"
                    >
                        Agregar al carrito
                    </motion.button>
                )}
            </motion.div> 
        </Link>
    ); 
} 

export default Card;