function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#F4F4F2] border-t border-[#CCCCCC] px-6 sm:px-12 lg:px-16 py-10 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#C89211]" />
          <span className="text-xs font-medium text-[#111111] uppercase tracking-wide">
            TU <span className="text-[#C89211] font-semibold">COMPRA</span>
          </span>
        </div>

        <div className="flex items-center gap-8">
          {[
            { nombre: "Instagram", url: "https://instagram.com/CMPRALO" },
            { nombre: "WhatsApp", url: "https://wa.me/59891637161" }
          ].map((red) => (
            <a
              key={red.nombre}
              href={red.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#111111] hover:text-[#C89211] text-xs font-medium uppercase tracking-wider transition-colors"
            >
              {red.nombre}
            </a>
          ))}
        </div>

        <div>
          <p className="text-[11px] text-[#777777] uppercase tracking-wider">
            © {year} TU COMPRA
          </p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;