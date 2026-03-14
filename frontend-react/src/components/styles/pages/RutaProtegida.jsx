import { Navigate } from "react-router-dom"

//--COMPONENTE QUE PROTEGE LA RUTA DE DASHBOARD Y VERIFICA SI HAY TOKEN PARA DEJAR PASAR--//

function RutaProtegida ({children}){
    const getToken= localStorage.getItem ("token")
    if (!getToken){
        return <Navigate to="/admin/login"/>
    }

    return (
        children
    )
}

export default RutaProtegida;