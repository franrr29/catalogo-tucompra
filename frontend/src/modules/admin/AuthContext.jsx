import { createContext, useState, useEffect, useContext } from "react";
import * as adminService from "./admin.service";

const AuthContext = createContext(undefined);

// envuelve la app entera y comparte si hay un admin logueado
export function AuthProvider({ children }) {
  const [isLogIn, setIsLogIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // al montar la app, le pregunta al backend si la cookie sigue siendo valida
  // hace falta preguntar porque la cookie es httpOnly: el js del navegador no puede leerla
  useEffect(() => {
    adminService.verificarSesion()
      .then(() => setIsLogIn(true))
      .catch(() => setIsLogIn(false))
      .finally(() => setLoading(false));
  }, []);

  function iniciarSesion() {
    setIsLogIn(true);
  }

  // devuelve la promise para que quien llame pueda esperar y despues navegar
  function cerrarSesion() {
    return adminService.logout().catch(() => {}).finally(() => setIsLogIn(false));
  }

  return (
    <AuthContext.Provider value={{ isLogIn, loading, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

// hook para leer el estado de sesion desde cualquier componente
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
