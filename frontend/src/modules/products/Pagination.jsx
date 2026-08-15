// controles simples para pasar de pagina en el catalogo
function Pagination({ paginaActual, totalPaginas, onCambiarPagina }) {
  if (totalPaginas <= 1) return null;

  const botonClass =
    "text-xs font-sans uppercase tracking-widest text-ink border border-[#111111] rounded-xl px-5 py-3 hover:bg-[#111111] hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink disabled:cursor-not-allowed";

  return (
    <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 mt-14">
      <button
        onClick={() => onCambiarPagina(paginaActual - 1)}
        disabled={paginaActual === 1}
        className={botonClass}
      >
        Anterior
      </button>

      <span className="text-xs font-sans text-muted uppercase tracking-widest">
        Página {paginaActual} de {totalPaginas}
      </span>

      <button
        onClick={() => onCambiarPagina(paginaActual + 1)}
        disabled={paginaActual === totalPaginas}
        className={botonClass}
      >
        Siguiente
      </button>
    </div>
  );
}

export default Pagination;
