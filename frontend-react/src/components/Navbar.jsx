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

  // ===VARIANTES PARA ANIMACIÓN EN CASCADA DEL MENÚ MOBILE===//
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
    "border border-white/15 px-5 py-2 text-[10px] text-white tracking-[0.25em] uppercase hover:bg-white hover:text-black transition-all duration-300 italic flex items-center justify-center backdrop-blur-sm";
  const btnDanger =
    "border border-red-900/40 text-red-500 text-[9px] tracking-widest uppercase px-4 py-2 hover:bg-red-900/80 hover:text-white transition-all duration-300";

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-black/70 backdrop-blur-xl border-b border-white/5 shadow-2xl"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">

        {/* ===IZQUIERDA: Hamburguesa mobile con animación de 3 líneas → X=== */}
        <div className="flex items-center md:hidden w-10">
          <motion.button
            whileTap={{ scale: 0.75 }}
            className="text-white focus:outline-none z-[60] flex flex-col gap-[5px] p-1"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <motion.span
              animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              className="block w-5 h-[1.5px] bg-white origin-center"
            />
            <motion.span
              animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="block w-5 h-[1.5px] bg-white"
            />
            <motion.span
              animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
              className="block w-5 h-[1.5px] bg-white origin-center"
            />
          </motion.button>
        </div>

        {/* ===LOGO=== */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex-shrink-0"
        >
          <Link
            to="/"
            className="text-white font-black text-lg tracking-[0.35em] uppercase hover:opacity-80 transition-opacity"
          >
            TU<span className="text-amber-500">COMPRA</span>
          </Link>
        </motion.div>

        {/* ===CENTRO: Links de navegación desktop + menú mobile=== */}
        <motion.ul
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className={`
            fixed md:static top-0 left-0 w-full h-screen md:h-auto
            bg-black/95 md:bg-transparent backdrop-blur-2xl md:backdrop-blur-none
            flex flex-col md:flex-row items-center justify-center gap-10
            transition-transform duration-500 ease-in-out z-50
            ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          {/* Link: Inicio */}
          <motion.li variants={itemVariants} whileHover={{ y: -2 }} className="group relative">
            <Link
              to="/"
              className="text-gray-400 hover:text-white text-[11px] tracking-[0.3em] uppercase transition-colors duration-300"
              onClick={() => setMenuOpen(false)}
            >
              Inicio
            </Link>
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-amber-500 group-hover:w-full transition-all duration-300" />
          </motion.li>

          {/* Link: Cómo comprar */}
          <motion.li variants={itemVariants} whileHover={{ y: -2 }} className="group relative">
            <Link
              to="/como-comprar"
              className="text-gray-400 hover:text-white text-[11px] tracking-[0.3em] uppercase transition-colors duration-300"
              onClick={() => setMenuOpen(false)}
            >
              Como comprar
            </Link>
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-amber-500 group-hover:w-full transition-all duration-300" />
          </motion.li>

          {/* Link: Contacto */}
          <motion.li variants={itemVariants} whileHover={{ y: -2 }} className="group relative">
            <Link
              to="/contacto"
              className="text-gray-400 hover:text-white text-[11px] tracking-[0.3em] uppercase transition-colors duration-300"
              onClick={() => setMenuOpen(false)}
            >
              Contacto
            </Link>
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-amber-500 group-hover:w-full transition-all duration-300" />
          </motion.li>

          {/* Link: Panel admin — solo visible si está logueado */}
          {isLogIn && (
            <motion.li variants={itemVariants} whileHover={{ y: -2 }} className="group relative">
              <Link
                to="/admin/dashboard"
                className="text-gray-400 hover:text-white text-[11px] tracking-[0.3em] uppercase transition-colors duration-300"
                onClick={() => setMenuOpen(false)}
              >
                Panel de administracion
              </Link>
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-amber-500 group-hover:w-full transition-all duration-300" />
            </motion.li>
          )}

          {/* ===BOTÓN DINÁMICO MOBILE: Login / Logout=== */}
          <motion.li variants={itemVariants} className="md:hidden mt-4">
            {isLogIn ? (
              <button
                onClick={() => { handleLogOut(); setMenuOpen(false); }}
                className="text-amber-500 text-[11px] tracking-[0.3em] uppercase border border-amber-500/30 px-8 py-3 hover:bg-amber-500/10 transition-all duration-300"
              >
                Cerrar Sesion
              </button>
            ) : (
              <Link
                to="/admin/login"
                className="text-amber-500 text-[11px] tracking-[0.3em] uppercase border border-amber-500/30 px-8 py-3 hover:bg-amber-500/10 transition-all duration-300"
                onClick={() => setMenuOpen(false)}
              >
                Ingresar
              </Link>
            )}
          </motion.li>
        </motion.ul>

        {/* ===DERECHA: Carrito + botón desktop=== */}
        <div className="flex items-center gap-5 w-10 md:w-auto justify-end">

          {/* Ícono de carrito — oculto si está logueado como admin */}
          {!isLogIn && (
            <Link to="/carrito">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.88 }}
                className="relative p-1 text-white hover:text-amber-500 transition-colors duration-300"
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
                    strokeWidth={1.3}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>

                {/* Badge contador del carrito con animación de entrada/salida */}
                <AnimatePresence>
                  {cartCounter > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-1 -right-1 bg-amber-500 text-black text-[8px] font-black h-4 w-4 flex items-center justify-center rounded-full"
                    >
                      {cartCounter}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )}

          {/* ===BOTÓN DINÁMICO DESKTOP: Login / Logout=== */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
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