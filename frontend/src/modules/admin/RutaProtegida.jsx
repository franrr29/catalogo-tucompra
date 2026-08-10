import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

//ruta protegida para que solo los usuarios logueados puedan acceder a ciertas rutas
function RutaProtegida ({ children }){
    const { isLogIn, loading } = useAuth();

    if (loading) return null;

    if (isLogIn === false){
         return <Navigate to="/admin/login"/>
    }
    return (
        children
    )
}

export default RutaProtegida;
