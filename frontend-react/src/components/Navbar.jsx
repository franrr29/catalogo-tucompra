import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

function Navbar({ cartCounter, isLogIn, handleLogOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate= useNavigate ()

  // Cambio de fondo al hacer scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
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
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  // Clase común para mantener el estilo Apple/Minimalista
  const btnClasses = "border border-white/20 px-5 py-2 text-[10px] text-white tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all duration-300 italic flex items-center justify-center";
  const btnDanger = "border border-red-900/50 text-red-500 text-[9px] tracking-widest uppercase px-4 py-2 hover:bg-red-900 hover:text-white transition-all";

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
      isScrolled ? "bg-black/80 backdrop-blur-md shadow-xl" : "bg-black"
    }`}>
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* IZQUIERDA: Botón Hamburguesa (Solo Mobile) */}
        <div className="flex items-center md:hidden w-10">
          <motion.button 
            whileTap={{ scale: 0.8 }} 
            className="text-white text-2xl focus:outline-none z-[60]" 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </motion.button>
        </div>

        {/* LOGO */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-shrink-0"
        >
          <Link to="/" className="text-white font-bold text-xl tracking-[0.4em] uppercase">
            TU<span className="text-amber-500">COMPRA</span>
          </Link>
        </motion.div>

        {/* CENTRO: Links de navegación */}
        <motion.ul 
          variants={containerVariants}
          initial="hidden"
          animate={"show"}
          className={`fixed md:static top-0 left-0 w-full h-screen md:h-auto bg-black md:bg-transparent flex flex-col md:flex-row items-center justify-center gap-10 transition-transform duration-500 ease-in-out z-50 ${
            menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        ><motion.li variants={itemVariants} whileHover={{ y: -2 }} className="group relative">
             <Link to="/"  className="text-gray-400 hover:text-white text-[11px] tracking-[0.3em] uppercase transition-colors"
              onClick={() => setMenuOpen(false)}
            >
               Inicio
           </Link>

           <span className="absolute -bottom-1 left-0 w-0 h-px bg-amber-500 group-hover:w-full transition-all duration-400" />
          </motion.li>
        
{        /*Boton de como comprar*/}
<        motion.li variants={itemVariants} whileHover={{ y: -2 }} className="group relative">
            <Link to= "/como-comprar" className="text-gray-400 hover:text-white text-[11px] tracking-[0.3em] uppercase transition-colors" onClick={() => setMenuOpen(false)}>
                Como comprar
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-amber-500 group-hover:w-full transition-all duration-400" />
          </Link>
          </motion.li>
          
        
         {/*Boton de contacto*/}
          <motion.li variants={itemVariants} whileHover={{ y: -2 }} className="group relative">
            <Link to= "/contacto" className="text-gray-400 hover:text-white text-[11px] tracking-[0.3em] uppercase transition-colors" onClick={() => setMenuOpen(false)}>
                Contacto
            </Link>  
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-amber-500 group-hover:w-full transition-all duration-400" />
           
          </motion.li>

          {/* Botón Dinámico para Mobile */}
          <motion.li variants={itemVariants} className="md:hidden mt-4">
            {isLogIn ? (
              <button 
                onClick={() => { handleLogOut(); setMenuOpen(false); }} 
                className="text-amber-500 text-[11px] tracking-[0.3em] uppercase border border-amber-500/30 px-8 py-3"
              >
                Cerrar Sesion
              </button>
            ) : (
              <Link 
                to="/admin/login" 
                className="text-amber-500 text-[11px] tracking-[0.3em] uppercase border border-amber-500/30 px-8 py-3"
                onClick={() => setMenuOpen(false)}
              >
                Ingresar
              </Link>
            )}
          </motion.li>
        </motion.ul>

        {/* DERECHA: Carrito e Interacción (Desktop) */}
        <div className="flex items-center gap-6 w-10 md:w-auto justify-end">
          
          <Link to="/carrito">
            <motion.div 
              whileHover={{ scale: 1.15 }} 
              whileTap={{ scale: 0.9 }} 
              className="relative p-1 text-white hover:text-amber-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              
              <AnimatePresence>
                {cartCounter > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 bg-amber-600 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full"
                  >
                    {cartCounter}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>

          {/* Botón Dinámico Desktop: Usamos div con motion para envolver el ternario */}
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className="hidden md:block" // Ocultamos el contenedor en mobile
          >
            {isLogIn ? (
              <button 
                onClick={()=> {handleLogOut (); navigate ("/admin/login")}} 
                className={btnDanger}
              >
                Cerrar sesion
              </button>
            ) : (
              <Link 
                to="/admin/login" 
                className={btnClasses}
              >
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