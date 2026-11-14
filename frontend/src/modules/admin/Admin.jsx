import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { login, verificarSesion } from "../../services/admin.service";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";

function Admin() {
  const [usuario, setUsuario] = useState("");
  const [contra, setContra] = useState("");
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();

  async function sendUserData() {
    try {
      await login(usuario, contra);
    } catch (error) {
      console.error("Error en el acceso");
      // solo un 401 significa credenciales malas; lo demas es un problema de conexion o del servidor
      if (error.response?.status === 401) {
        toast.error("CREDENCIALES INVÁLIDAS");
      } else {
        toast.error("NO SE PUDO CONECTAR CON EL SERVIDOR, INTENTA DE NUEVO");
      }
      return;
    }

    // el login pudo salir bien pero el navegador no guardar la cookie (por ejemplo si bloquea
    // cookies de terceros): se comprueba antes de entrar para no dejar pasar con una sesion inexistente
    try {
      await verificarSesion();
    } catch (error) {
      console.error("La sesion no quedo activa despues del login");
      if (error.response?.status === 401) {
        toast.error("TU NAVEGADOR ESTÁ BLOQUEANDO LA COOKIE DE SESIÓN. PROBÁ SIN MODO INCÓGNITO O PERMITÍ COOKIES DE TERCEROS PARA ESTE SITIO", { duration: 8000 });
      } else {
        toast.error("NO SE PUDO VERIFICAR LA SESIÓN, INTENTA DE NUEVO");
      }
      return;
    }

    iniciarSesion();
    navigate("/admin/dashboard");
    toast.success("ACCESO CONCEDIDO");
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased flex items-center justify-center px-6 selection:bg-[#E2E2DF] relative overflow-hidden">

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm rounded-2xl border border-[#1A1A1A]/15 bg-white/40 backdrop-blur-md p-10 flex flex-col gap-8 relative z-10"
      >

        <div className="space-y-3 border-b border-border pb-6">
          <div className="flex items-center gap-2 font-sans">
            <span className="w-1.5 h-1.5 bg-brand" />
            <span className="text-[11px] text-muted uppercase tracking-widest">
              ACCESO RESTRINGIDO
            </span>
          </div>
          <h1 className="text-2xl font-light tracking-tight text-ink">
            SISTEMA <span className="font-semibold text-brand">INTERNO</span>
          </h1>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 group">
            <label className="text-xs font-sans text-muted-light uppercase tracking-wider">
              Correo
            </label>
            <input
              type="text"
              placeholder="USUARIO"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="bg-white/50 rounded-lg border border-[#1A1A1A]/15 text-ink text-xs px-4 py-3.5 focus:outline-none focus:border-[#111111] transition-all placeholder-[#999999] w-full tracking-wider uppercase"
            />
          </div>

          <div className="flex flex-col gap-2 group">
            <label className="text-xs font-sans text-muted-light uppercase tracking-wider">
              Clave de seguridad
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={contra}
              onChange={(e) => setContra(e.target.value)}
              className="bg-white/50 rounded-lg border border-[#1A1A1A]/15 text-ink text-xs px-4 py-3.5 focus:outline-none focus:border-[#111111] transition-all placeholder-[#999999] w-full tracking-wider"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={sendUserData}
            className="w-full rounded-xl bg-[#111111] text-[#F4F4F2] hover:bg-brand text-xs font-medium tracking-widest uppercase px-4 py-4 transition-colors"
          >
            Ingresar
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 mt-2 border-t border-border pt-6">
          <p className="text-xs font-sans text-muted-light text-center tracking-widest uppercase">
            Tu Compra © 2026
          </p>
        </div>

      </motion.div>
    </div>
  );
}

export default Admin;
