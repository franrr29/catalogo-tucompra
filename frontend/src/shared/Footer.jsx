import { Link } from "react-router-dom";

function Footer() {
  const year = new Date().getFullYear();

  const navLinks = [
    { name: "Inicio", path: "/" },
    { name: "Cómo comprar", path: "/como-comprar" },
    { name: "Contacto", path: "/contacto" },
  ];

  const redes = [
    { nombre: "Instagram", url: "https://instagram.com/CMPRALO" },
    { nombre: "WhatsApp", url: "https://wa.me/59891637161" },
  ];

  return (
    <footer className="bg-black border-t-2 border-[#C89211] px-6 sm:px-12 lg:px-16 py-14 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-start justify-between gap-12 pb-10 border-b border-[#222222]">

        {/* marca */}
        <div>
          <span className="font-sans leading-[0.85] uppercase flex flex-col mb-3">
            <span className="font-light text-white text-lg tracking-tight">TU</span>
            <span className="font-bold text-[#C89211] text-lg tracking-tight">COMPRA</span>
          </span>
          <p className="text-[13px] text-[#999999] max-w-xs leading-relaxed">
            Los mejores productos dentro del límite de precio que vos elegís.
          </p>
        </div>

        {/* navegacion */}
        <div>
          <p className="text-[11px] font-sans text-[#777777] uppercase tracking-wide mb-4">
            Navegación
          </p>
          <div className="flex flex-col gap-2.5">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-white hover:text-[#C89211] text-xs font-medium uppercase tracking-wider transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* redes */}
        <div>
          <p className="text-[11px] font-sans text-[#777777] uppercase tracking-wide mb-4">
            Seguinos
          </p>
          <div className="flex flex-col gap-2.5">
            {redes.map((red) => (
              <a
                key={red.nombre}
                href={red.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#C89211] text-xs font-medium uppercase tracking-wider transition-colors"
              >
                {red.nombre}
              </a>
            ))}
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 pt-6">
        <p className="text-[11px] text-[#777777] uppercase tracking-wider font-sans">
          © {year} TU COMPRA — Todos los derechos reservados
        </p>
        <div className="flex items-center gap-2 font-sans">
          <span className="w-1.5 h-1.5 bg-[#C89211]" />
          <span className="text-[11px] text-[#777777] uppercase tracking-wide">
            Edición 2026
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;