import { useState, useEffect } from "react";
import Card from "./ProductCard";
import { motion } from "framer-motion";
import { API_URL } from "../config";

function ListaProductos({ addCart, isLogIn }) {
    const [productos, setProductos] = useState([]);
    const [precioMax, setPrecioMax] = useState(Infinity);
    const [loading, setLoading] = useState(true);

    // ===FILTRADO DE PRODUCTOS POR PRECIO===//
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
        <div className="min-h-screen bg-black px-4 sm:px-10 py-24 selection:bg-amber-500/30 overflow-hidden">

            {/* ===FONDO ATMOSFÉRICO: manchas de luz ambiental=== */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] bg-amber-600/4 rounded-full blur-[100px]" />
            </div>

            {/* ===HEADER=== */}
            <header className="relative z-10 mb-14">

                {/* Etiqueta pequeña estilo streetwear */}
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-amber-500 text-[9px] tracking-[0.5em] uppercase font-bold mb-3"
                >
                    — Temporada actual
                </motion.p>

                {/* Título principal */}
                <motion.h1
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-white text-4xl sm:text-5xl font-black tracking-tight uppercase leading-none"
                >
                    Colección{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                        2026
                    </span>
                </motion.h1>

                {/* Línea decorativa animada */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "80px" }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="h-[2px] bg-gradient-to-r from-amber-500 to-transparent mt-4"
                />
            </header>

            {/* ===BARRA DE FILTROS: glassmorphism=== */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative z-10 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-6"
            >
                {/* Input de precio con fondo glass */}
                <div className="flex flex-col gap-2">
                    <label className="text-amber-500/70 text-[9px] tracking-[0.3em] uppercase font-bold">
                        Presupuesto Máximo
                    </label>

                    {/* Contenedor glass del input */}
                    <div className="relative backdrop-blur-md bg-white/5 border border-white/10 rounded-sm overflow-hidden">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/60 text-sm font-bold">$</span>
                        <input
                            type="number"
                            placeholder="Ej: 5000"
                            onChange={(e) => setPrecioMax(Number(e.target.value) || Infinity)}
                            className="bg-transparent text-white text-sm pl-8 pr-4 py-3 focus:outline-none w-64 tracking-widest placeholder:text-gray-700"
                        />
                        {/* Borde inferior amber al enfocar — efecto Apple */}
                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-amber-500/50 to-transparent" />
                    </div>
                </div>

                {/* Contador de productos */}
                <div className="sm:mt-6 backdrop-blur-md bg-white/3 border border-white/5 px-4 py-2">
                    <p className="text-gray-500 text-[9px] tracking-widest uppercase">
                        Mostrando:{" "}
                        <span className="text-amber-500 font-bold">{productosFiltrados.length}</span>{" "}
                        productos
                    </p>
                </div>
            </motion.div>

            {/* ===ESTADO DE CARGA=== */}
            {loading ? (
                <div className="flex flex-col justify-center items-center py-32 gap-4 relative z-10">
                    {/* Spinner doble */}
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 border-2 border-white/5 rounded-full" />
                        <div className="absolute inset-0 border-2 border-t-amber-500 border-r-amber-500/30 rounded-full animate-spin" />
                    </div>
                    <p className="text-gray-600 text-[9px] tracking-[0.4em] uppercase animate-pulse">
                        Cargando catálogo
                    </p>
                </div>
            ) : (
                /* ===GRID DE PRODUCTOS=== */
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { staggerChildren: 0.08 } }
                    }}
                    className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {productosFiltrados.length > 0 ? (
                        productosFiltrados.map((prod) => (
                            <Card
                                key={prod.id}
                                producto={prod}
                                addCart={addCart}
                                isLogIn={isLogIn}
                            />
                        ))
                    ) : (
                        /* ===ESTADO VACÍO=== */
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full flex flex-col items-center py-32 gap-4"
                        >
                            <div className="w-12 h-12 border border-white/10 flex items-center justify-center">
                                <span className="text-amber-500/50 text-xl">∅</span>
                            </div>
                            <p className="text-gray-600 tracking-[0.3em] text-[10px] uppercase">
                                Sin productos en este rango de precios.
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

export default ListaProductos;