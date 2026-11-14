import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

// solo deja pasar si hay un usuario logueado
function RutaProtegida ({ children }){
    const { isLogIn, loading, sesionIndeterminada, reintentarVerificacion } = useAuth();

    if (loading) return null;

    if (isLogIn === false){
        // no se pudo confirmar la sesion (servidor arrancando o sin conexion): no se manda al login
        if (sesionIndeterminada){
            return (
                <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center font-sans text-xs uppercase tracking-widest text-ink">
                    <p>No se pudo verificar la sesión. El servidor puede estar iniciando.</p>
                    <button
                        onClick={reintentarVerificacion}
                        className="rounded-xl bg-[#111111] text-[#F4F4F2] hover:bg-brand px-6 py-3 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            )
        }
        return <Navigate to="/admin/login"/>
    }
    return (
        children
    )
}

export default RutaProtegida;
