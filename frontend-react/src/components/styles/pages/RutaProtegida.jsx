import { Navigate } from "react-router-dom"

//ruta protegida para que solo los usuarios logueados puedan acceder a ciertas rutas
function RutaProtegida ({ children, isLogIn, loading}){
     
    if (loading) return null;
    
    if (isLogIn === false){
         return <Navigate to="/admin/login"/>
    }
    return (
        children
    )
}

export default RutaProtegida;