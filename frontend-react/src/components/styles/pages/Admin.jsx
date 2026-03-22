import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { API_URL } from "../../../config";
import { toast } from "react-hot-toast"

function Admin({handleLogIn}) {
  const [usuario, setUsuario] = useState("");
  const [contra, setContra] = useState("");
  const navigate = useNavigate();

  // Logica para el envio de datos:
  async function sendUserData() {
    try {
      const sendUserPassw = await fetch(API_URL + "/api/login/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: usuario, password: contra })
      });

      if (!sendUserPassw.ok) {
        throw new Error("Error al mandar usuario y contraseña");
      }

      const data = await sendUserPassw.json();
      localStorage.setItem("token", data.token);
      handleLogIn()
      navigate("/admin/dashboard");

      // Notificacion al entrar como admin con estilo ambar:
      toast.success("ACCESO CONCEDIDO", {
          style: {
            background: '#000',
            color: '#f59e0b',
            border: '1px solid rgba(245,158,11,0.3)',
            fontWeight: 'bold',
            fontSize: '10px',
            letterSpacing: '0.2em'
          }
      })
      

    } catch (error) {
      console.error("Error en el acceso");
      toast.error("CREDENCIALES INVALIDAS", {
        style: {
          background: 'rgba(0,0,0,0.9)',
          color: '#ef4444',
          border: '1px solid rgba(239,68,68,0.3)',
          backdropFilter: 'blur(10px)',
          fontSize: '10px',
          fontWeight: 'bold',
          letterSpacing: '0.2em'
        }
      });
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 selection:bg-amber-500/30 relative overflow-hidden">
      
      {/* Elementos decorativos de fondo (luces difusas ambar) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Contenedor del Formulario */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-sm bg-white/[0.02] backdrop-blur-xl border border-white/10 p-10 flex flex-col gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm relative z-10"
      >

        {/* Encabezado */}
        <div className="space-y-2">
          <h1 className="text-white text-sm tracking-[0.6em] uppercase font-light">
            SISTEMA <span className="text-amber-500 font-bold">INTERNO</span>
          </h1>
          <div className="w-8 h-[1px] bg-amber-500" />
        </div>

        {/* Grupo de Inputs */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 group">
            <label className="text-[10px] text-gray-500 tracking-[0.3em] uppercase ml-1 group-focus-within:text-amber-500 transition-colors">
              Correo
            </label>
            <input
              type="text"
              placeholder="USUARIO"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="bg-white/[0.03] border border-white/5 text-white text-[11px] px-4 py-4 focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.05] transition-all duration-300 placeholder-gray-700 w-full tracking-widest uppercase rounded-sm"
            />
          </div>

          <div className="flex flex-col gap-2 group">
            <label className="text-[10px] text-gray-500 tracking-[0.3em] uppercase ml-1 group-focus-within:text-amber-500 transition-colors">
              Clave de seguridad
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={contra}
              onChange={(e) => setContra(e.target.value)}
              className="bg-white/[0.03] border border-white/5 text-white text-[11px] px-4 py-4 focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.05] transition-all duration-300 placeholder-gray-700 w-full tracking-widest rounded-sm"
            />
          </div>
        </div>

        {/* Boton de Acceso */}
        <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.01, backgroundColor: "#f59e0b", color: "#000" }}
              whileTap={{ scale: 0.99 }}
              onClick={sendUserData}
              className="w-full bg-transparent border border-amber-500/50 text-amber-500 text-[10px] font-bold tracking-[0.3em] uppercase px-4 py-4 transition-all duration-300 rounded-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]"
            >
              Ingresar
            </motion.button>
        </div>

        {/* Pie de pagina */}
        <div className="flex flex-col items-center gap-4 mt-2">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <p className="text-[10px] text-gray-600 text-center tracking-[0.3em] uppercase">
              Tu Compra © 2026 | Restricted Area
            </p>
        </div>

      </motion.div>
    </div>
  );
}

export default Admin;