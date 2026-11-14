import { createContext, useState, useEffect, useContext, useCallback } from "react";
import * as adminService from "../../services/admin.service";

const AuthContext = createContext(undefined);

// envuelve la app entera y comparte si hay un admin logueado
export function AuthProvider({ children }) {
  const [isLogIn, setIsLogIn] = useState(false);
  const [loading, setLoading] = useState(true);
  // true cuando no se pudo saber si hay sesion (red caida, servidor arrancando, error 5xx)
  const [sesionIndeterminada, setSesionIndeterminada] = useState(false);

  const verificar = useCallback(() => {
    setLoading(true);
    setSesionIndeterminada(false);

    return adminService.verificarSesion()
      .then(() => setIsLogIn(true))
      .catch((error) => {
        // solo un 401 significa "no hay sesion valida"; un timeout, un error de red o un 5xx
        // (por ejemplo Render despertando) no dicen nada sobre la sesion y no deben sacar al admin
        if (error.response?.status === 401) {
          setIsLogIn(false);
        } else {
          setSesionIndeterminada(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    verificar();
  }, [verificar]);

  function iniciarSesion() {
    setIsLogIn(true);
    setSesionIndeterminada(false);
  }

  // devuelve la promise para que quien llame pueda esperar y despues navegar
  function cerrarSesion() {
    return adminService.logout().catch(() => {}).finally(() => setIsLogIn(false));
  }

  return (
    <AuthContext.Provider value={{ isLogIn, loading, sesionIndeterminada, reintentarVerificacion: verificar, iniciarSesion, cerrarSesion }}>
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
