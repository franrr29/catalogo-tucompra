import { useState, useEffect } from "react";
import Card from "./ProductCard";
import { motion } from "framer-motion";
import { API_URL } from "../config";

function ListaProductos({ addCart, isLogIn }) {
    const [productos, setProductos] = useState([]);
    const [precioMax, setPrecioMax] = useState(Infinity);
    const [loading, setLoading] = useState(true);

    const productosFiltrados = productos.filter(p => p.precio <= precioMax);

    useEffect(() => {
        async function obtenerProducts() {
            try {
                const resp = await fetch( API_URL+"/api/productos");
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
        <div className="min-h-screen bg-black px-6 sm:px-12 py-24 selection:bg-amber-500/30">
            <header className="mb-16">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-white text-3xl font-light tracking-[0.4em] uppercase mb-4"
                >
                    Colección <span className="text-amber-500 font-bold">2026</span>
                </motion.h1>
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "60px" }}
                    transition={{ duration: 1 }}
                    className="h-px bg-amber-500" 
                />
            </header>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-6"
            >
                <div className="flex flex-col gap-2">
                    <label className="text-amber-500/60 text-[10px] tracking-[0.2em] uppercase font-medium">
                        Presupuesto Máximo
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/50 text-sm">$</span>
                        <input
                            type="number"
                            placeholder="Ej: 5000"
                            onChange={(e) => setPrecioMax(Number(e.target.value) || Infinity)}
                            className="bg-white/5 border border-white/10 text-white text-sm pl-8 pr-4 py-3 focus:outline-none focus:border-amber-500/50 transition-all duration-500 w-64 tracking-widest placeholder:text-gray-700"
                        />
                    </div>
                </div>
                <div className="sm:mt-6">
                    <p className="text-gray-500 text-[10px] tracking-widest uppercase">
                        Mostrando: <span className="text-white">{productosFiltrados.length}</span> productos.
                    </p>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-2 border-white/10 border-t-amber-500 rounded-full animate-spin"/>
                </div>
            ) : (
                <motion.div 
                    initial="hidden"
                    animate="show"
                    variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                >
                    {productosFiltrados.length > 0 ? (
                        productosFiltrados.map((prod) => (
                            <Card key={prod.id} producto={prod} addCart={addCart} isLogIn={isLogIn} />
                        ))
                    ) : (
                        <p className="text-gray-600 italic tracking-widest text-sm col-span-full py-20 text-center">
                            No se encontraron productos
                        </p>
                    )}
                </motion.div>
            )}
        </div>
    );
}

export default ListaProductos;