import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

function Navbar({ cartCounter, isLogIn, handleLogOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  // Cambio de fondo al hacer scroll 
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Variantes para la animación de cascada en el menú móvil
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2, 
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 }, 
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    },
  };

  // Clase común mejorada: Refinamos el borde y el espaciado
  const btnClasses = "border border-white/10 px-6 py-2.5 text-[10px] text-white tracking-[0.25em] uppercase hover:bg-white hover:text-black transition-all duration-500 ease-in-out flex items-center justify-center backdrop-blur-sm";
  const btnDanger = "border border-red-500/20 text-red-400 text-[9px] tracking-widest uppercase px-5 py-2.5 hover:bg-red-500 hover:text-white transition-all duration-500";

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 ease-in-out ${
        isScrolled 
          ? "bg-black/60 backdrop-blur-lg border-b border-white/5 py-2" // Glassmorphism sutil y reducción de altura
          : "bg-transparent py-4" // Más aire al inicio
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-8 flex items-center justify-between">
        
        {/* IZQUIERDA: Botón Hamburguesa (Solo Mobile) */}
        <div className="flex items-center md:hidden w-12">
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            className="text-white text-2xl focus:outline-none z-[60]" 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {/* Íconos más minimalistas */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </motion.button>
        </div>

        {/* LOGO - Animación Fade In inicial */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "circOut" }}
          className="flex-shrink-0"
        >
          <Link to="/" className="text-white font-medium text-lg tracking-[0.5em] uppercase group">
            TU<span className="text-amber-500 group-hover:text-amber-400 transition-colors duration-500">COMPRA</span>
          </Link>
        </motion.div>

        {/* CENTRO: Links de navegación */}
        <motion.ul 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className={`fixed md:static top-0 left-0 w-full h-screen md:h-auto bg-black/95 md:bg-transparent flex flex-col md:flex-row items-center justify-center gap-12 md:gap-8 transition-all duration-500 ease-in-out z-50 ${
            menuOpen ? "opacity-100 visible" : "opacity-0 invisible md:opacity-100 md:visible"
          }`}
        >
          <motion.li variants={itemVariants} className="group relative">
            <Link 
              to="/" 
              className="text-gray-300 hover:text-white text-[10px] tracking-[0.3em] uppercase transition-colors duration-500"
              onClick={() => setMenuOpen(false)}
            >
              Inicio
            </Link>
            {/* Underline animado más fino */}
            <span className="absolute -bottom-2 left-1/2 w-0 h-[1px] bg-amber-500 group-hover:w-1/2 group-hover:left-1/4 transition-all duration-500" />
          </motion.li>
        
          <motion.li variants={itemVariants} className="group relative">
            <Link 
              to="/como-comprar" 
              className="text-gray-300 hover:text-white text-[10px] tracking-[0.3em] uppercase transition-colors duration-500" 
              onClick={() => setMenuOpen(false)}
            >
              Como comprar
            </Link>
            <span className="absolute -bottom-2 left-1/2 w-0 h-[1px] bg-amber-500 group-hover:w-1/2 group-hover:left-1/4 transition-all duration-500" />
          </motion.li>
          
          <motion.li variants={itemVariants} className="group relative">
            <Link 
              to="/contacto" 
              className="text-gray-300 hover:text-white text-[10px] tracking-[0.3em] uppercase transition-colors duration-500" 
              onClick={() => setMenuOpen(false)}
            >
              Contacto
            </Link>
            <span className="absolute -bottom-2 left-1/2 w-0 h-[1px] bg-amber-500 group-hover:w-1/2 group-hover:left-1/4 transition-all duration-500" />
          </motion.li>

          {isLogIn && (
            <motion.li variants={itemVariants} className="group relative border md:border-none border-white/5 p-4 md:p-0">
              <Link 
                to="/admin/dashboard" 
                className="text-amber-500/80 hover:text-amber-400 text-[10px] tracking-[0.3em] uppercase transition-colors" 
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <span className="hidden md:block absolute -bottom-2 left-1/2 w-0 h-[1px] bg-amber-500 group-hover:w-1/2 group-hover:left-1/4 transition-all duration-500" />
            </motion.li>
          )}

          {/* Botón Mobile Refinado */}
          <motion.li variants={itemVariants} className="md:hidden mt-8">
            <button 
              onClick={() => { isLogIn ? handleLogOut() : navigate("/admin/login"); setMenuOpen(false); }} 
              className="text-white text-[10px] tracking-[0.4em] uppercase border border-white/20 px-10 py-4 active:bg-white active:text-black transition-all"
            >
              {isLogIn ? "Logout" : "Acceso"}
            </button>
          </motion.li>
        </motion.ul>

        {/* DERECHA: Carrito e Interacción (Desktop) */}
        <div className="flex items-center gap-8 w-12 md:w-auto justify-end">
          
          {!isLogIn && (
            <Link to="/carrito">
              <motion.div 
                whileHover={{ y: -2 }} 
                whileTap={{ scale: 0.95 }} 
                className="relative p-1 text-white/80 hover:text-amber-500 transition-all duration-500"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                
                <AnimatePresence>
                  {cartCounter > 0 && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.5 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute -top-1 -right-2 bg-white text-black text-[8px] font-bold h-4 w-4 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                    >
                      {cartCounter}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )}

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hidden md:block"
          >
            {isLogIn ? (
              <button 
                onClick={()=> {handleLogOut (); navigate ("/admin/login")}} 
                className={btnDanger}
              >
                Salir
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