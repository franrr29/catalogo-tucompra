import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

function Navbar({ cartCounter, isLogIn, handleLogOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { name: "Inicio", path: "/" },
    { name: "Cómo comprar", path: "/como-comprar" },
    { name: "Contacto", path: "/contacto" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#111111] border-b border-[#2A2A2A] py-4">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 flex items-center justify-between">

        {/* Hamburguesa Mobile */}
        <button
          className="md:hidden text-white focus:outline-none z-50 p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          <div className="w-5 flex flex-col gap-1.5">
            <span
              className={`block h-[2px] bg-white transition-transform duration-200 ${
                menuOpen ? "rotate-45 translate-y-[7.5px]" : ""
              }`}
            />
            <span
              className={`block h-[2px] bg-white transition-opacity duration-200 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-[2px] bg-white transition-transform duration-200 ${
                menuOpen ? "-rotate-45 -translate-y-[7.5px]" : ""
              }`}
            />
          </div>
        </button>

        {/* Marca / Logo */}
        <Link
          to="/"
          className="font-sans leading-[0.85] uppercase flex flex-col"
        >
          <span className="font-light text-white text-lg tracking-tight">TU</span>
          <span className="font-bold text-[#C89211] text-lg tracking-tight">COMPRA</span>
        </Link>

        {/* Links del menú */}
        <div
          className={`
            fixed md:static top-0 left-0 w-full h-screen md:h-auto
            bg-[#111111] md:bg-transparent
            flex flex-col md:flex-row items-center justify-center gap-8 md:gap-10
            transition-opacity duration-200 z-40
            ${
              menuOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto"
            }
          `}
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `font-sans font-medium text-base md:text-xs tracking-wider uppercase transition-colors pb-1 border-b-2 ${
                  isActive
                    ? "text-[#C89211] border-[#C89211]"
                    : "text-white border-transparent hover:text-[#C89211]"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}

          {isLogIn && (
            <NavLink
              to="/admin/dashboard"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `font-sans font-semibold text-base md:text-xs tracking-wider uppercase transition-colors pb-1 border-b-2 ${
                  isActive
                    ? "text-[#C89211] border-[#C89211]"
                    : "text-white border-transparent hover:text-[#C89211]"
                }`
              }
            >
              Dashboard
            </NavLink>
          )}

          {/* Acción móvil */}
          <div className="md:hidden mt-6">
            {isLogIn ? (
              <button
                onClick={() => {
                  handleLogOut();
                  setMenuOpen(false);
                }}
                className="text-white font-sans text-xs uppercase tracking-wider underline underline-offset-4"
              >
                Salir
              </button>
            ) : (
              <Link
                to="/admin/login"
                onClick={() => setMenuOpen(false)}
                className="text-white bg-[#C89211] font-sans text-xs font-medium uppercase tracking-wider px-8 py-3 block transition-colors"
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>

        {/* Acciones derechas */}
        <div className="flex items-center gap-6">
          {!isLogIn && (
            <Link
              to="/carrito"
              className="relative text-white hover:text-[#C89211] transition-colors p-1 flex items-center gap-1.5"
              aria-label="Carrito de compras"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.25 10.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm7.5 0a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                />
              </svg>

              <AnimatePresence>
                {cartCounter > 0 && (
                  <span className="font-sans text-xs font-bold text-[#C89211]">
                    ({cartCounter})
                  </span>
                )}
              </AnimatePresence>
            </Link>
          )}

          {/* Estado de sesión / Ingresar Desktop */}
          <div className="hidden md:block">
            {isLogIn ? (
              <button
                onClick={() => {
                  handleLogOut();
                  navigate("/admin/login");
                }}
                className="flex items-center gap-2 text-xs font-sans text-white font-medium hover:text-[#C89211] tracking-wider uppercase transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
                Usuario autenticado
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-3 h-3"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            ) : (
              <Link
                to="/admin/login"
                className="text-xs font-sans text-white bg-[#C89211] hover:bg-[#A3740A] px-5 py-2 transition-colors uppercase tracking-wider font-medium"
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;