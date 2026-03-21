import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function Card({ producto, addCart, isLogIn }) {
    const PanelUsuarioActivo = isLogIn ? "div" : Link;
    const panelUsuarioActivoProps = isLogIn ? {} : { to: `/producto/${producto.id}` };

    return (
        <PanelUsuarioActivo {...panelUsuarioActivoProps} className="block group">
            <motion.div 
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} // Custom ease para suavidad premium
                whileHover={{ y: -8 }}
                className="relative bg-[#0d0d0d] border border-white/5 rounded-2xl p-6 flex flex-col gap-5 transition-all duration-500 overflow-hidden shadow-[0_0_40px_-15px_rgba(0,0,0,0.7)] hover:shadow-amber-500/5 hover:border-white/10"
            >
                {/* Cabecera: Nombre y Línea animada */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-white/90 font-light text-xs tracking-[0.25em] uppercase group-hover:text-amber-500 transition-colors duration-500">
                        {producto.nombre}
                    </h1>
                    {/* Línea de acento: se expande desde el centro al hacer hover */}
                    <div className="h-[1px] w-6 bg-amber-500/40 group-hover:w-full transition-all duration-700 ease-in-out" />
                </div>

                {/* IMAGEN: Efecto "Flotante" sin contenedor rígido */}
                <div className="relative w-full aspect-square flex items-center justify-center py-4">
                    {/* Glow de fondo sutil al hacer hover */}
                    <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/5 blur-3xl rounded-full transition-all duration-700" />
                    
                    <motion.img 
                        src={producto.imagen_url || "https://via.placeholder.com/300x300?text=Sin+Imagen"} 
                        alt={producto.nombre}
                        className="relative z-10 w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-110"
                        onError={(e) => {
                            e.target.src = "https://via.placeholder.com/300x300?text=Error+en+URL";
                        }}
                    />
                </div>

                {/* Precio y Stock */}
                <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1">
                        <p className="text-2xl font-light text-white tracking-tight">
                            <span className="text-amber-500 text-sm mr-1">$</span>
                            {producto.precio.toLocaleString()}
                        </p>
                        
                        <div className="flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-amber-500/80 shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                            <p className="text-[9px] text-gray-500 tracking-[0.1em] uppercase">
                                Stock: {producto.stock}
                            </p>
                        </div>
                    </div>
                </div>

                {/* BOTÓN SORPRESA: Aparece con slide-up y fade al hacer hover en la card */}
                {!isLogIn && (
                    <motion.button 
                        initial={{ opacity: 0.6, y: 10 }} // Estado base más discreto
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        animate={ { 
                            opacity: 1, 
                            y: 0,
                            backgroundColor: "transparent",
                            borderColor: "rgba(255,255,255,0.1)"
                        }}
                        onClick={(e) => {
                            e.preventDefault(); 
                            addCart(producto.id);
                        }}
                        className="mt-2 border border-white/5 text-white text-[9px] tracking-[0.3em] uppercase py-3.5 hover:bg-white hover:text-black hover:border-white transition-all duration-500 font-medium backdrop-blur-sm"
                    >
                        Añadir a selección
                    </motion.button>
                )}
                
                {/* Overlay sutil de gradiente para profundidad */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
            </motion.div> 
        </PanelUsuarioActivo>
    ); 
} 

export default Card;