import { useState, useRef, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAdminSession } from "./hooks/useAdminSession";
import { useNuevasVentas } from "./hooks/useNuevasVentas";
import CampanitaVentas from "./CampanitaVentas";
import { IconoMenu, IconoSalir, IconoCaja, IconoVentas, IconoCamion, IconoTienda } from "./ui/iconos";
import { boton } from "./ui/estilos";

// secciones del panel, en el orden del menu lateral
const SECCIONES = [
  { to: "/admin/productos", texto: "Productos", Icono: IconoCaja },
  { to: "/admin/ventas", texto: "Ventas", Icono: IconoVentas },
  { to: "/admin/envios", texto: "Envíos", Icono: IconoCamion },
];

// clases de los items del menu: pildora oscura para la pagina activa y fondo suave al pasar el mouse
const CLASE_ITEM =
  "group flex items-center gap-3 rounded-control px-3.5 py-2.5 text-sm font-semibold transition-colors duration-150 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-oro-acento focus-visible:ring-offset-2 focus-visible:ring-offset-superficie";

// estructura comun del panel de administracion: menu lateral, barra superior con la campanita y cerrar sesion, y la pagina activa
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

  // ventas nuevas para la campanita y envios por despachar para la insignia del menu
  const { cantidad, ultimos, porDespachar, marcarComoVistas } = useNuevasVentas(manejarSesionExpirada);

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
    <div className="min-h-screen bg-paper text-ink font-sans md:flex">
      {menuAbierto && (
        <div
          data-testid="fondo-menu"
          aria-hidden="true"
          onClick={() => setMenuAbierto(false)}
          className="md:hidden fixed inset-0 z-30 bg-ink/40"
        />
      )}

      <nav
        id="menu-admin"
        aria-label="Secciones del panel"
        className={`${
          menuAbierto ? "flex animate-deslizar motion-reduce:animate-none" : "hidden"
        } md:flex flex-col w-64 shrink-0 h-screen overflow-y-auto bg-superficie border-r border-linea shadow-elevada md:shadow-none fixed top-0 left-0 z-40 md:sticky md:self-start`}
      >
        <div className="flex flex-col gap-1 px-6 pt-7 pb-6">
          <span className="font-semibold text-xl leading-none tracking-tight text-ink">TU</span>
          <span className="font-bold text-xl leading-none tracking-tight text-oro-titulo">COMPRA</span>
        </div>

        <p className="px-6 pb-2 text-xs font-semibold uppercase tracking-[0.06em] text-muted">Gestión</p>

        <div className="flex flex-col gap-1 px-3">
          {SECCIONES.map(({ to, texto, Icono }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${CLASE_ITEM} ${isActive ? "bg-ink text-paper shadow-tarjeta" : "text-ink hover:bg-paper"}`
              }
            >
              <Icono className="w-5 h-5 shrink-0 text-muted group-aria-[current=page]:text-oro-acento" />
              <span className="truncate">{texto}</span>
              {to === "/admin/envios" && porDespachar > 0 && (
                <span className="ml-auto min-w-[1.5rem] rounded-full bg-oro-acento px-2 py-1 text-center text-xs font-bold leading-none text-ink">
                  {porDespachar}
                  <span className="sr-only"> por despachar</span>
                </span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="mt-auto border-t border-linea p-3">
          <Link to="/" className={`${CLASE_ITEM} text-muted hover:bg-paper hover:text-ink`}>
            <IconoTienda className="w-5 h-5 shrink-0" />
            <span>Ver tienda</span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 h-16 shrink-0 flex items-center justify-between gap-3 border-b border-linea bg-paper/90 backdrop-blur px-4 sm:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              ref={botonMenuRef}
              type="button"
              onClick={() => setMenuAbierto((abierto) => !abierto)}
              aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuAbierto}
              aria-controls="menu-admin"
              className="md:hidden -ml-2 rounded-control p-2 text-ink transition-colors duration-150 motion-reduce:transition-none hover:bg-linea/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-oro-acento"
            >
              <IconoMenu className="w-6 h-6" />
            </button>
            <span className="md:hidden flex flex-col leading-none text-sm tracking-tight" aria-hidden="true">
              <span className="font-semibold text-ink">TU</span>
              <span className="font-bold text-oro-titulo">COMPRA</span>
            </span>
            <p className="hidden md:flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-muted">
              <span className="w-2 h-2 rounded-full bg-oro-acento" aria-hidden="true" />
              Panel de gestión
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <CampanitaVentas cantidad={cantidad} ultimos={ultimos} onMarcarVistas={marcarComoVistas} />
            <button
              type="button"
              onClick={cerrarSesion}
              aria-label="Cerrar sesión"
              className={`${boton.secundario} !px-3 sm:!px-4`}
            >
              <IconoSalir className="w-4 h-4" />
              <span className="hidden sm:inline" aria-hidden="true">Cerrar sesión</span>
            </button>
          </div>
        </header>

        <main className="flex-1 min-w-0">
          <Outlet context={{ manejarSesionExpirada }} />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
