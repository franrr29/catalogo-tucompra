// encabezado de pagina: titulo (h1), descripcion opcional y, a la derecha, badges o acciones (children)
function PageHeader({ titulo, descripcion, children }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1.5 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">{titulo}</h1>
        {descripcion && <p className="text-sm text-muted">{descripcion}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{children}</div>}
    </header>
  );
}

export default PageHeader;
