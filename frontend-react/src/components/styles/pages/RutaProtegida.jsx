import { Navigate } from "react-router-dom"

//--COMPONENTE QUE PROTEGE LA RUTA DE DASHBOARD Y VERIFICA SI HAY TOKEN PARA DEJAR PASAR--//

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