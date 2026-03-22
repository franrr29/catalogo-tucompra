import { useState, useEffect } from "react";
import Card from "./ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../config";

function ListaProductos({ addCart, isLogIn }) {
    const [productos, setProductos] = useState([]);
    const [precioMax, setPrecioMax] = useState(Infinity);
    const [loading, setLoading] = useState(true);

    // ===FILTRADO DE PRODUCTOS POR PRECIO=== //
    const productosFiltrados = productos.filter(p => p.precio <= precioMax);

    useEffect(() => {
        async function obtenerProducts() {
            try {
                const resp = await fetch(API_URL + "/api/productos");
                if (!resp.ok) throw new Error("Error en el servidor");
                const data = await resp.json();
                setProductos(data);
            } catch (error) {
                console.error("Error al traer los productos", error);
            } finally {
                setLoading(false);
            }
        }
        obtenerProducts();
    }, []);

    return (
        <div className="min-h-screen bg-black px-6 sm:px-12 py-24 selection:bg-amber-500/30 relative overflow-hidden">

            {/* ===FONDO ATMOSFERICO: LUCES DIFUSAS=== */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-amber-500/[0.03] rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/[0.02] rounded-full blur-[100px]" />
            </div>

            {/* ===HEADER PRINCIPAL=== */}
            <header className="relative z-10 mb-20 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <p className="text-amber-500 text-[10px] tracking-[0.6em] uppercase font-bold mb-4 flex items-center gap-3">
                        <span className="w-10 h-[1px] bg-amber-500/30"></span>
                        Coleccion Exclusiva
                    </p>
                    <h1 className="text-white text-5xl md:text-7xl font-light tracking-tighter uppercase leading-none">
                        TU <span className="font-black text-amber-500">COMPRA</span>
                    </h1>
                    <div className="h-[1px] w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent mt-8" />
                </motion.div>
            </header>

            {/* ===BARRA DE HERRAMIENTAS: FILTROS Y CONTADOR=== */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative z-10 mb-16 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-8"
            >
                {/* Filtro de precio premium */}
                <div className="flex flex-col gap-3 w-full md:w-auto">
                    <label className="text-gray-500 text-[8px] tracking-[0.4em] uppercase font-bold ml-1">
                        Filtrar por presupuesto
                    </label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/40 text-xs font-bold">$</span>
                        <input
                            type="number"
                            placeholder="PRECIO MAXIMO"
                            onChange={(e) => setPrecioMax(Number(e.target.value) || Infinity)}
                            className="bg-white/[0.03] border border-white/10 text-white text-[11px] pl-10 pr-6 py-4 focus:outline-none focus:border-amber-500/40 transition-all w-full md:w-72 tracking-[0.2em] placeholder:text-gray-800 rounded-sm"
                        />
                        {/* Linea de enfoque animada */}
                        <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-amber-500 group-focus-within:w-full transition-all duration-500" />
                    </div>
                </div>

                {/* Contador de stock visual */}
                <div className="flex items-center gap-6 border-l border-white/10 pl-8 h-12">
                    <div className="flex flex-col">
                        <span className="text-amber-500 text-xl font-light leading-none">{productosFiltrados.length}</span>
                        <span className="text-gray-600 text-[8px] tracking-widest uppercase mt-1">Articulos</span>
                    </div>
                    <div className="h-full w-[1px] bg-white/5" />
                    <p className="text-gray-500 text-[9px] tracking-[0.2em] uppercase font-medium">
                        Catalogo <br /> <span className="text-white/40">Disponible</span>
                    </p>
                </div>
            </motion.div>

            {/* ===CONTENIDO PRINCIPAL=== */}
            <div className="max-w-7xl mx-auto relative z-10">
                {loading ? (
                    /* Loader Minimalista */
                    <div className="flex flex-col justify-center items-center py-40 gap-6">
                        <div className="w-12 h-12 relative">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-full h-full border-t-2 border-amber-500 rounded-full"
                            />
                            <div className="absolute inset-0 border-2 border-white/5 rounded-full" />
                        </div>
                        <p className="text-gray-600 text-[9px] tracking-[0.5em] uppercase animate-pulse">
                            Sincronizando Inventario
                        </p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {productosFiltrados.length > 0 ? (
                            <motion.div
                                key="grid"
                                initial="hidden"
                                animate="show"
                                variants={{
                                    hidden: { opacity: 0 },
                                    show: { 
                                        opacity: 1, 
                                        transition: { staggerChildren: 0.1 } 
                                    }
                                }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                            >
                                {productosFiltrados.map((prod) => (
                                    <motion.div
                                        key={prod.id}
                                        variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            show: { opacity: 1, y: 0 }
                                        }}
                                    >
                                        <Card
                                            producto={prod}
                                            addCart={addCart}
                                            isLogIn={isLogIn}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            /* Estado Vacio Premium */
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center py-40 gap-6 border border-white/5 bg-white/[0.01] rounded-sm"
                            >
                                <span className="text-amber-500/20 text-6xl font-light tracking-tighter uppercase">SIN RESULTADOS</span>
                                <p className="text-gray-600 tracking-[0.4em] text-[10px] uppercase">
                                    Intenta ajustar el rango de precios
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

export default ListaProductos;