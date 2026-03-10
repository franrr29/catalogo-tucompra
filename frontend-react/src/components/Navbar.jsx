import { useState } from "react";
import { Link } from "react-router-dom";  // <--PARA ABRIR EL CARRITO EN OTRA PAGINA

function Navbar({cartCounter}) {
  const [menuOpen, setMenuOpen] = useState(false);

  

  return (
    <nav className="navbar">
      {/* Botón hamburguesa solo visible en móvil */}
      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      {/* Logo */}
      <div className="logo">Tu Compra</div>

      {/* Links de navegación */}
      <ul className={`navbar-links ${menuOpen ? "open" : ""}`}>
        <li><a href="#inicio">Inicio</a></li>
        <li><a href="#productos">Productos</a></li>
        <li><a href="#contacto">Contacto</a></li>
        <li><a href="#login">Ingresar</a></li>
      </ul>

      {/* Carrito */}
      <div className="carrito">
       <Link to= "/carrito">{cartCounter}</Link>
      <Link to= "/admin/login">Ingresar</Link>
      </div>
    </nav>
  );
}

export default Navbar;
