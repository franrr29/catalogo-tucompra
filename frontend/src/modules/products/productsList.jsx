import { useState, useEffect, useRef } from "react";
import Card from "./ProductCard";
import Pagination from "./Pagination";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../../config";
import { useAuth } from "../admin/AuthContext";

const PRODUCTOS_POR_PAGINA = 4;

function ListaProductos({ addCart }) {
    const { isLogIn } = useAuth();
    const [productos, setProductos] = useState([]);
    const [precioMax, setPrecioMax] = useState(Infinity);
    const [precioInput, setPrecioInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [paginaActual, setPaginaActual] = useState(1);
    const gridRef = useRef(null);

    const productosFiltrados = productos.filter((p) => p.precio <= precioMax);

    const totalPaginas = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA);
    const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
    const productosPaginados = productosFiltrados.slice(inicio, inicio + PRODUCTOS_POR_PAGINA);

    function irAlTopeDelCatalogo() {
        gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function cambiarPagina(nuevaPagina) {
        setPaginaActual(nuevaPagina);
        irAlTopeDelCatalogo();
    }

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
        <div className="min-h-screen bg-[#F4F4F2] text-[#111111] font-sans antialiased selection:bg-[#E2E2DF]">

            <div className="px-6 sm:px-12 lg:px-16 pt-32 sm:pt-36 pb-12">

                {/* control de inventario y filtro */}
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="max-w-7xl mx-auto mb-16 border-b border-[#CCCCCC] pb-8"
                >
                    <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">

                        {/* izquierda: metrica de coleccion */}
                        <div>
                            <p className="text-[11px] font-sans text-[#777777] mb-2 uppercase tracking-wide">
                                COLECCIÓN
                            </p>
                            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#111111]">
                                {productosFiltrados.length}
                                <span className="ml-3 text-sm font-sans text-[#666666]">
                                    {productosFiltrados.length === 1 ? "producto" : "productos"}
                                </span>
                            </h2>
                        </div>

                        {/* derecha: filtro de presupuesto */}
                        <div className="text-right">
                            <p className="text-[11px] font-sans text-[#777777] mb-2 uppercase tracking-wide">
                                HASTA
                            </p>
                            <div className="inline-flex items-baseline gap-1 border-b-2 border-[#C89211] pb-1">
                                <span className="text-xl sm:text-2xl font-bold text-[#C89211]">$</span>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    placeholder="15.000"
                                    value={precioInput}
                                    onChange={(e) => {
                                        setPrecioInput(e.target.value);
                                        setPrecioMax(Number(e.target.value) || Infinity);
                                        setPaginaActual(1);
                                    }}
                                    className="
                                        w-32 sm:w-36
                                        bg-transparent
                                        text-right
                                        text-2xl sm:text-3xl
                                        font-bold
                                        text-[#111111]
                                        placeholder:text-[#CCCCCC]
                                        focus:outline-none
                                    "
                                />
                            </div>
                        </div>

                    </div>
                </motion.div>

                {/* catalogo de productos */}
                <main ref={gridRef} className="max-w-7xl mx-auto scroll-mt-24">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-32 gap-3 font-sans">
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
                                    {productosPaginados.map((prod) => (
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
                                    className="border border-[#CCCCCC] p-12 font-sans text-left max-w-2xl"
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

                <Pagination
                    paginaActual={paginaActual}
                    totalPaginas={totalPaginas}
                    onCambiarPagina={cambiarPagina}
                />

            </div>

        </div>
    );
}

export default ListaProductos;
