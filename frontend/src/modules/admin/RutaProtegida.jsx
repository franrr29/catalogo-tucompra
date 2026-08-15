import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

// solo deja pasar si hay un usuario logueado
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
