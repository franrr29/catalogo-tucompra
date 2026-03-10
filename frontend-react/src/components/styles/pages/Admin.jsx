import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Admin() {
  const [usuario, setUsuario] = useState("")
  const [contra, setContra] = useState("")
  const navigate = useNavigate()

  async function sendUserData() {
    try {

      //sendUserPassw envia a admin.routes.js el usuario y contraseña para que el back valide para login
      const sendUserPassw = await fetch("http://localhost:4000/api/login/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: usuario, password: contra })
      })

      if (!sendUserPassw.ok) {
        throw new Error("Error al mandar usuario y contraseña")
      }

      const data = await sendUserPassw.json()
      localStorage.setItem("token", data.token)
      navigate("/admin/dashboard")

    } catch (error) {
      console.error("Error")
    }
  }

    //Formulario para el usuario login que luego se envia al back a admin.routes.js
  return (
    <div>
      <h1>Formulario de usuario</h1>
      <input type="text"
        placeholder="Correo"
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
      />
      <input type="password"
        placeholder="Contraseña"
        value={contra}
        onChange={(e) => setContra(e.target.value)}
      />
      <button onClick={sendUserData}>Acceder</button>
    </div>
  )
}

export default Admin;