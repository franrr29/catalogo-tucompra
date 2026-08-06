import { useState, useEffect } from "react";
import Card from "./ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../config";

function ListaProductos({ addCart, isLogIn }) {
    const [productos, setProductos] = useState([]);
    const [precioMax, setPrecioMax] = useState(Infinity);
    const [loading, setLoading] = useState(true);

    const productosFiltrados = productos.filter((p) => p.precio <= precioMax);

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
        <div className="min-h-screen bg-[#F4F4F2] text-[#111111] font-sans antialiased px-6 sm:px-12 lg:px-16 py-12 selection:bg-[#E2E2DF]">
            
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-16 border-b border-[#111111] pb-8">
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col sm:flex-row sm:items-end justify-between gap-6"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-3 font-mono">
                            <span className="w-1.5 h-1.5 bg-[#C89211]" />
                            <span className="text-[11px] text-[#666666]">
                                CATÁLOGO GENERAL
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-[#111111]">
                            TU <span className="font-semibold text-[#C89211]">COMPRA</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 text-[12px] font-mono text-[#666666]">
                        <span>EDICIÓN 2026</span>
                        <span className="text-[#C89211]">—</span>
                        <span>{isLogIn ? "USUARIO AUTENTICADO" : "MODO INVITADO"}</span>
                    </div>
                </motion.div>
            </header>

            {/* Control de inventario / Filtro */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="max-w-7xl mx-auto mb-16"
            >
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-[#CCCCCC] pb-6">

                    {/* Izquierda: Métrica de colección */}
                    <div>
                        <p className="text-[11px] font-mono text-[#777777] mb-2 uppercase tracking-wide">
                            COLECCIÓN
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#111111]">
                            {productosFiltrados.length}
                            <span className="ml-3 text-sm font-mono text-[#666666]">
                                {productosFiltrados.length === 1 ? "producto" : "productos"}
                            </span>
                        </h2>
                    </div>

                    {/* Derecha: Filtro de presupuesto */}
                    <div className="flex items-center gap-3 font-mono">
                        <span className="text-[12px] text-[#777777] uppercase tracking-wide">
                            HASTA
                        </span>

                        <div className="relative flex items-center border-b border-[#111111] pb-1 transition-colors focus-within:border-[#C89211]">
                            <span className="text-sm text-[#C89211] mr-1 select-none">
                                $
                            </span>
                            <input
                                type="number"
                                placeholder="15.000"
                                onChange={(e) =>
                                    setPrecioMax(Number(e.target.value) || Infinity)
                                }
                                className="
                                    w-28
                                    bg-transparent
                                    text-right
                                    text-[15px]
                                    text-[#111111]
                                    placeholder:text-[#999999]
                                    focus:outline-none
                                "
                            />
                        </div>
                    </div>

                </div>
            </motion.div>

            {/* Catálogo de Productos */}
            <main className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32 gap-3 font-mono">
                        <span className="w-2 h-2 bg-[#C89211]" />
                        <span className="text-[11px] text-[#666666]">
                            Cargando productos...
                        </span>
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
                                        transition: { staggerChildren: 0.04 }
                                    }
                                }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                            >
                                {productosFiltrados.map((prod) => (
                                    <motion.div
                                        key={prod.id}
                                        variants={{
                                            hidden: { opacity: 0, y: 10 },
                                            show: { opacity: 1, y: 0 }
                                        }}
                                        transition={{ duration: 0.3 }}
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
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="border border-[#CCCCCC] p-12 font-mono text-left max-w-2xl"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-1.5 h-1.5 bg-[#C89211]" />
                                    <span className="text-[11px] text-[#666666]">
                                        SIN RESULTADOS
                                    </span>
                                </div>

                                <h3 className="text-xl font-sans text-[#111111] mb-2 font-normal">
                                    No hay productos dentro del límite de precio seleccionado.
                                </h3>

                                <p className="text-[13px] text-[#666666] leading-relaxed">
                                    Aumente el presupuesto en el campo superior para visualizar los artículos disponibles.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </main>

        </div>
    );
}

export default ListaProductos;