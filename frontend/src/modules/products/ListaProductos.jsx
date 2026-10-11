import { useState, useEffect, useRef } from "react";
import Card from "./ProductCard";
import Pagination from "./Pagination";
import PromoBanner from "./PromoBanner";
import { motion, AnimatePresence } from "framer-motion";
import { obtenerProductos } from "../../services/productos.service";
import { useAuth } from "../admin/AuthContext";

const PRODUCTOS_POR_PAGINA = 4;

const HERO_BG = "/banner.jpeg";

const HEADLINE = "ESTILO QUE PERDURA";

function ListaProductos({ addCart }) {
    const { isLogIn } = useAuth();
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paginaActual, setPaginaActual] = useState(1);
    const gridRef = useRef(null);

    const totalPaginas = Math.ceil(productos.length / PRODUCTOS_POR_PAGINA);
    const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
    const productosPaginados = productos.slice(inicio, inicio + PRODUCTOS_POR_PAGINA);

    function irAlTopeDelCatalogo() {
        gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function cambiarPagina(nuevaPagina) {
        setPaginaActual(nuevaPagina);
        irAlTopeDelCatalogo();
    }

    useEffect(() => {
        async function cargarProductos() {
            try {
                const data = await obtenerProductos();
                setProductos(data);
            } catch (error) {
                console.error("Error al traer los productos", error);
            } finally {
                setLoading(false);
            }
        }
        cargarProductos();
    }, []);

    return (
        <div className="min-h-screen bg-paper text-ink font-sans antialiased selection:bg-[#E2E2DF]">

            {/* hero premium a todo el ancho, con la foto por detras del navbar fijo */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative isolate w-full h-[50vh] sm:h-[60vh] overflow-hidden flex items-center justify-center"
            >
                {/* foto de fondo */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url("${HERO_BG}")` }}
                />

                {/* velo oscuro para legibilidad del texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-black/30" />

                {/* contenido */}
                <div className="relative z-10 text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="flex flex-col items-center mb-4"
                    >
                        <p className="text-[11px] sm:text-xs font-sans text-brand uppercase tracking-[0.3em] mb-2">
                            Tu Compra · Colección
                        </p>
                        <motion.span
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                            className="block w-10 h-[2px] bg-brand origin-center"
                        />
                    </motion.div>

                    <motion.h1
                        initial="hidden"
                        animate="show"
                        variants={{
                            hidden: {},
                            show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
                        }}
                        className="text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-white"
                    >
                        {/* cada palabra arranca desenfocada y abajo, despues entra nitida */}
                        {HEADLINE.split(" ").map((palabra, i) => (
                            <motion.span
                                key={i}
                                variants={{
                                    hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
                                    show: {
                                        opacity: 1,
                                        y: 0,
                                        filter: "blur(0px)",
                                        transition: { duration: 0.6, ease: "easeOut" },
                                    },
                                }}
                                className="inline-block mr-3 sm:mr-4 last:mr-0"
                            >
                                {palabra}
                            </motion.span>
                        ))}
                    </motion.h1>
                </div>
            </motion.section>

            <div className="px-6 sm:px-12 lg:px-16 pt-14 sm:pt-20 pb-12">

                {/* promo entre el banner y los relojes */}
                <div className="mb-14 sm:mb-20">
                    <PromoBanner />
                </div>

                {/* catalogo de productos */}
                <main ref={gridRef} className="max-w-7xl mx-auto scroll-mt-24">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-32 gap-3 font-sans">
                            <span className="w-2 h-2 bg-brand" />
                            <span className="text-[11px] text-muted">
                                Cargando productos...
                            </span>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {productosPaginados.length > 0 ? (
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
                                    className="border border-border p-12 font-sans text-left max-w-2xl"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="w-1.5 h-1.5 bg-brand" />
                                        <span className="text-[11px] text-muted">
                                            SIN RESULTADOS
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-sans text-ink mb-2 font-normal">
                                        No hay productos disponibles por el momento.
                                    </h3>

                                    <p className="text-[13px] text-muted leading-relaxed">
                                        Volvé a intentarlo más tarde.
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
