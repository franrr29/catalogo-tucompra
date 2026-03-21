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
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8 }}
                // EFECTO VIDRIO BRILLANTE: bg-white/5, backdrop-blur-md, border-white/10 y border-t-white/20
                className="relative bg-white/5 backdrop-blur-md border border-white/10 border-t-white/20 rounded-2xl p-6 flex flex-col gap-5 transition-all duration-500 overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.7)] hover:border-white/20 hover:shadow-amber-500/5"
            >
                {/* Cabecera: Nombre y Línea animada */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-white/90 font-light text-xs tracking-[0.25em] uppercase group-hover:text-amber-500 transition-colors duration-500">
                        {producto.nombre}
                    </h1>
                    <div className="h-[1px] w-6 bg-amber-500/40 group-hover:w-full transition-all duration-700 ease-in-out" />
                </div>

                {/* IMAGEN: Efecto "Flotante" */}
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
                            <p className="text-[9px] text-gray-400 tracking-[0.1em] uppercase">
                                Stock: {producto.stock}
                            </p>
                        </div>
                    </div>
                </div>

                {/* BOTÓN ÁMBAR CORREGIDO: Letra siempre blanca */}
                {!isLogIn && (
                    <motion.button 
                        whileHover={{ scale: 1.02, backgroundColor: "#fbbf24" }} // Un ámbar ligeramente más claro en hover
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                            e.preventDefault(); 
                            addCart(producto.id);
                        }}
                        // bg-amber-500 para el color base, text-white para que no cambie, font-bold
                        className="mt-2 bg-amber-500 text-white text-[10px] tracking-[0.2em] uppercase py-3.5 rounded-lg transition-all duration-300 font-bold shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                    >
                        Agregar al carrito
                    </motion.button>
                )}
                
                {/* Overlay sutil para profundidad */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
            </motion.div> 
        </PanelUsuarioActivo>
    ); 
} 

export default Card;