import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAdminSession } from "./hooks/useAdminSession";

// secciones del panel, en el orden del menu lateral
const SECCIONES = [
  { to: "/admin/productos", texto: "Productos" },
  { to: "/admin/ventas", texto: "Ventas" },
  { to: "/admin/envios", texto: "Envíos" },
];

// el navbar publico es fijo y mide ~4.5rem; el header del panel mide 3.5rem
const ALTO_NAVBAR = "4.5rem";
const TOP_MENU = "8rem";

// estructura comun del panel de administracion: header con cerrar sesion, menu lateral y la pagina activa
// la sesion (cierre por inactividad) se maneja aca una sola vez para que cubra todas las paginas del panel
function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const botonMenuRef = useRef(null);

  const { cerrarSesion } = useAdminSession(navigate);

  // un 401 en cualquier pagina cierra la sesion; el aviso queda visible despues de la redireccion
  function manejarSesionExpirada() {
    toast.error("tu sesion expiro o no se pudo validar, inicia sesion de nuevo");
    return cerrarSesion();
  }

  // al cambiar de pagina el menu movil se cierra
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  // con el menu movil abierto, Escape lo cierra y devuelve el foco al boton que lo abrio
  useEffect(() => {
    if (!menuAbierto) return undefined;
    function alTeclear(evento) {
      if (evento.key === "Escape") {
        setMenuAbierto(false);
        botonMenuRef.current?.focus();
      }
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [menuAbierto]);

  return (
    <div className="min-h-screen bg-paper text-ink font-sans" style={{ paddingTop: ALTO_NAVBAR }}>
      <header
        className="sticky z-30 h-14 border-b border-border bg-paper/95 backdrop-blur px-4 sm:px-8 flex items-center justify-between gap-4"
        style={{ top: ALTO_NAVBAR }}
      >
        <div className="flex items-center gap-3">
          <button
            ref={botonMenuRef}
            type="button"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
            aria-controls="menu-admin"
            className="md:hidden p-2 -ml-2 rounded border border-transparent hover:border-border focus:outline-none focus-visible:border-[#111111]"
          >
            <span className="block w-5 space-y-1.5" aria-hidden="true">
              <span className="block h-[2px] bg-[#111111]" />
              <span className="block h-[2px] bg-[#111111]" />
              <span className="block h-[2px] bg-[#111111]" />
            </span>
          </button>
          <span className="text-[10px] text-muted uppercase tracking-widest">Panel de gestión</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={cerrarSesion}
            className="text-xs font-sans uppercase tracking-wider text-red-600 hover:text-red-500 border border-border rounded px-4 py-2 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="flex">
        {menuAbierto && (
          <div
            data-testid="fondo-menu"
            aria-hidden="true"
            onClick={() => setMenuAbierto(false)}
            className="md:hidden fixed inset-0 z-20 bg-black/30"
          />
        )}

        <nav
          id="menu-admin"
          aria-label="Secciones del panel"
          style={{ top: TOP_MENU, height: `calc(100vh - ${TOP_MENU})` }}
          className={`${menuAbierto ? "flex" : "hidden"} md:flex flex-col gap-1 w-56 shrink-0 border-r border-border bg-paper p-4 fixed md:sticky left-0 z-30 md:z-10 self-start overflow-y-auto`}
        >
          {SECCIONES.map(({ to, texto }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center justify-between rounded px-3 py-2.5 text-xs font-sans uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] ${
                  isActive ? "bg-[#111111] text-paper" : "text-ink hover:bg-[#E2E2DF]/60"
                }`
              }
            >
              {texto}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 min-w-0">
          <Outlet context={{ manejarSesionExpirada }} />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
