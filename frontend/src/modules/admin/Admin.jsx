import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { login } from "../../services/admin.service";
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
      iniciarSesion();
      navigate("/admin/dashboard");

      toast.success("ACCESO CONCEDIDO");

    } catch (error) {
      console.error("Error en el acceso");
      toast.error("CREDENCIALES INVÁLIDAS");
    }
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
