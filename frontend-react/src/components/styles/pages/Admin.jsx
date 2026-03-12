import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Admin({handleLogIn}) {
  const [usuario, setUsuario] = useState("");
  const [contra, setContra] = useState("");
  const navigate = useNavigate();

  //Logica para el envío de datos:
  async function sendUserData() {
    try {
      const sendUserPassw = await fetch("http://localhost:4000/api/login/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: usuario, password: contra })
      });

      if (!sendUserPassw.ok) {
        throw new Error("Error al mandar usuario y contraseña");
      }

      const data = await sendUserPassw.json();
      localStorage.setItem("token", data.token);
      handleLogIn ()
      navigate("/admin/dashboard");
      

    } catch (error) {
      console.error("Error en el acceso");
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 selection:bg-amber-500/30">
      
      {/* Contenedor del Formulario con animación de entrada */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1.2 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm bg-[#0a0a0a] border border-white/5 p-10 flex flex-col gap-8 shadow-2xl"
      >

        {/* Encabezado del Login */}
        <div className="text-center md:text-left">
          <h1 className="text-white text-md tracking-[0.5em] uppercase font-bold mb-4">
            Panel <span className="text-amber-500">Privado</span>
          </h1>
          <div className="w-12 h-[1px] bg-amber-500 mx-auto md:mx-0" />
        </div>

        {/* Grupo de Inputs */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[9px] text-gray-500 tracking-[0.2em] uppercase ml-1">Usuario</label>
            <input
              type="text"
              placeholder="admin@tucompra.com"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="bg-transparent border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-all duration-500 placeholder-gray-800 w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[9px] text-gray-500 tracking-[0.2em] uppercase ml-1">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={contra}
              onChange={(e) => setContra(e.target.value)}
              className="bg-transparent border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-all duration-500 placeholder-gray-800 w-full"
            />
          </div>
        </div>

        {/* Botón de Acceso con efectos de Framer Motion */}
        <motion.button
          whileHover={{ letterSpacing: "0.4em" }} // Se expande un poco el texto al pasar el mouse
          whileTap={{ scale: 0.98 }}
          onClick={sendUserData}
          className="bg-white text-black text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-4 hover:bg-amber-500 transition-all duration-500"
        >
          Acceder al Sistema
        </motion.button>

        {/* Pie de página del login */}
        <p className="text-[9px] text-gray-600 text-center tracking-widest uppercase mt-2">
          Solo personal autorizado
        </p>

      </motion.div>

    </div>
  );
}

export default Admin;