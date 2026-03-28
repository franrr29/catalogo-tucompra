import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function Card({ producto, addCart, isLogIn }) {
    const PanelBase = isLogIn ? "div" : Link;
    const enlace = isLogIn ? {} : { to: `/producto/${producto.id}` };

    return (
        <PanelBase {...enlace} className="block group">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -5 }}
                className="relative bg-white/[0.05] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 flex flex-col h-full transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 shadow-2xl"
            >
                {/* 1. TEXTO SUPERIOR */}
                <div className="mb-6 h-14"> {/* Altura fija para alinear el nombre */}
                    <p className="text-amber-500 text-[9px] tracking-[0.3em] uppercase font-bold mb-1">
                        Nuevo Ingreso
                    </p>
                    <h2 className="text-white text-sm tracking-widest uppercase font-bold whitespace-normal break-words leading-tight">
                        {producto.nombre}
                    </h2>
                </div>

                {/* 2. IMAGEN */}
                <div className="relative w-full aspect-square flex items-center justify-center p-2 mb-6">
                    <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full group-hover:bg-amber-500/10 transition-colors duration-500" />
                    <img 
                        src={producto.imagen_url || "https://via.placeholder.com/300x300?text=No+Image"} 
                        alt={producto.nombre}
                        className="relative z-10 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                </div>

                {/* Contenedor inferior con flex-grow para empujar el botón al fondo */}
                <div className="flex-grow flex flex-col justify-end gap-6">
                    
                    {/* 3. PRECIO Y STOCK */}
                    <div className="flex justify-between items-end border-t border-white/5 pt-4">
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-[12px] uppercase tracking-widest mb-1">Precio</span>
                            <p className="text-white text-xl font-medium tracking-tighter">
                                <span className="text-amber-500 text-xs mr-0.5">$</span>
                                {Number(producto.precio).toLocaleString()}
                            </p>
                        </div>
                        
                        <div className="text-right">
                            <span className="text-gray-500 text-[12px] uppercase tracking-widest mb-1">Stock</span>
                            <p className="text-white/60 text-[12px] font-bold">{producto.stock} u.</p>
                        </div>
                    </div>

                    {/* 4. BOTON ACCION */}
                    {!isLogIn && (
                        <button 
                            onClick={(e) => {
                                e.preventDefault(); 
                                addCart(producto.id);
                            }}
                            className="w-full bg-white text-black text-[10px] font-black tracking-[0.2em] uppercase py-4 rounded-xl hover:bg-amber-500 transition-all duration-300 active:scale-95 shadow-lg"
                        >
                            Agregar al carrito
                        </button>
                    )}
                </div>
                
            </motion.div> 
        </PanelBase>
    ); 
} 

export default Card;