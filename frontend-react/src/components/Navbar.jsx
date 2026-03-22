import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

function Navbar({ cartCounter, isLogIn, handleLogOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  // ===CAMBIO DE FONDO AL HACER SCROLL===//
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ===VARIANTES PARA ANIMACION EN CASCADA DEL MENU MOBILE===//
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // ===CLASES REUTILIZABLES DE BOTONES===//
  
  const btnClasses =
    "border border-white/10 bg-white/5 backdrop-blur-md px-7 py-2.5 text-[10px] text-white tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all duration-500 flex items-center justify-center font-bold";
  
  const btnDanger =
    "border border-red-500/20 text-red-500 text-[9px] tracking-[0.3em] uppercase px-6 py-2.5 hover:bg-red-500 hover:text-white transition-all duration-500 rounded-full font-bold";

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 ${
        isScrolled
          ? "bg-black/80 backdrop-blur-2xl border-b border-white/5 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-8 flex items-center justify-between">

        {/* ===IZQUIERDA: Hamburguesa mobile con animacion de 3 lineas → X=== */}
        <div className="flex items-center md:hidden w-10">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="text-white focus:outline-none z-[60] flex flex-col gap-[6px] p-1"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <motion.span
              animate={menuOpen ? { rotate: 45, y: 7.5 } : { rotate: 0, y: 0 }}
              className="block w-6 h-[1.5px] bg-white origin-center"
            />
            <motion.span
              animate={menuOpen ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
              className="block w-4 h-[1.5px] bg-amber-500"
            />
            <motion.span
              animate={menuOpen ? { rotate: -45, y: -7.5 } : { rotate: 0, y: 0 }}
              className="block w-6 h-[1.5px] bg-white origin-center"
            />
          </motion.button>
        </div>

        {/* ===LOGO=== */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-shrink-0"
        >
          <Link
            to="/"
            className="text-white font-black text-xl tracking-[0.4em] uppercase group"
          >
            TU<span className="text-amber-500 group-hover:text-white transition-colors duration-500">COMPRA</span>
          </Link>
        </motion.div>

        {/* ===CENTRO: Links de navegacion desktop + menu mobile=== */}
        <motion.ul
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className={`
            fixed md:static top-0 left-0 w-full h-screen md:h-auto
            bg-black md:bg-transparent backdrop-blur-3xl md:backdrop-blur-none
            flex flex-col md:flex-row items-center justify-center gap-12
            transition-all duration-700 ease-in-out z-50
            ${menuOpen ? "translate-x-0 opacity-100" : "-translate-x-full md:translate-x-0 md:opacity-100"}
          `}
        >
          {/* Link: Inicio */}
          <motion.li variants={itemVariants} className="group relative">
            <Link
              to="/"
              className="text-gray-400 group-hover:text-white text-[10px] tracking-[0.4em] uppercase transition-all duration-500"
              onClick={() => setMenuOpen(false)}
            >
              Inicio
            </Link>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-amber-500 group-hover:w-full transition-all duration-500" />
          </motion.li>

          {/* Link: Como comprar */}
          <motion.li variants={itemVariants} className="group relative">
            <Link
              to="/como-comprar"
              className="text-gray-400 group-hover:text-white text-[10px] tracking-[0.4em] uppercase transition-all duration-500"
              onClick={() => setMenuOpen(false)}
            >
              Como comprar
            </Link>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-amber-500 group-hover:w-full transition-all duration-500" />
          </motion.li>

          {/* Link: Contacto */}
          <motion.li variants={itemVariants} className="group relative">
            <Link
              to="/contacto"
              className="text-gray-400 group-hover:text-white text-[10px] tracking-[0.4em] uppercase transition-all duration-500"
              onClick={() => setMenuOpen(false)}
            >
              Contacto
            </Link>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-amber-500 group-hover:w-full transition-all duration-500" />
          </motion.li>

          {/* Link: Panel admin — solo visible si esta logueado */}
          {isLogIn && (
            <motion.li variants={itemVariants} className="group relative">
              <Link
                to="/admin/dashboard"
                className="text-amber-500/70 group-hover:text-amber-500 text-[10px] tracking-[0.4em] uppercase transition-all duration-500"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-white group-hover:w-full transition-all duration-500" />
            </motion.li>
          )}

          {/* ===BOTON DINAMICO MOBILE: Login / Logout=== */}
          <motion.li variants={itemVariants} className="md:hidden mt-8">
            {isLogIn ? (
              <button
                onClick={() => { handleLogOut(); setMenuOpen(false); }}
                className="text-red-500 text-[10px] tracking-[0.4em] uppercase border border-red-500/20 px-10 py-4 "
              >
                Salir
              </button>
            ) : (
             <Link
             to="/admin/login"
             className="text-white text-[10px] tracking-[0.4em] uppercase border border-amber-500/40 bg-black/50 backdrop-blur-sm px-10 py-4 font-bold  hover:bg-amber-500/10 transition-all duration-300 block text-center"
             onClick={() => setMenuOpen(false)}
            >
              Ingresar
            </Link>
            )}
            
          </motion.li>
        </motion.ul>

        {/* ===DERECHA: Carrito + boton desktop=== */}
        <div className="flex items-center gap-8 w-10 md:w-auto justify-end">

          {/* Icono de carrito — oculto si esta logueado como admin */}
          {!isLogIn && (
            <Link to="/carrito">
              <motion.div
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-2 text-white hover:text-amber-500 transition-all duration-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>

                {/* Badge contador del carrito con animacion de entrada/salida */}
                <AnimatePresence>
                  {cartCounter > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-0 right-0 bg-amber-500 text-black text-[7px] font-black h-4 w-4 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    >
                      {cartCounter}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )}

          {/* ===BOTON DINAMICO DESKTOP: Login / Logout=== */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:block"
          >
            {isLogIn ? (
              <button
                onClick={() => { handleLogOut(); navigate("/admin/login"); }}
                className={btnDanger}
              >
                Cerrar sesion
              </button>
            ) : (
              <Link to="/admin/login" className={btnClasses}>
                Ingresar
              </Link>
            )}
          </motion.div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;