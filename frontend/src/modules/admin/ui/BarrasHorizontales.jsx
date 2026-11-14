// barras horizontales hechas con CSS: la longitud es relativa al valor mayor.
// el valor siempre esta escrito en texto (la barra es decorativa y queda oculta a lectores de pantalla),
// asi no se depende del color ni de la forma para leer el dato
// items: [{ clave, etiqueta, valor, texto }]; ariaLabel nombra la lista
function BarrasHorizontales({ items, ariaLabel }) {
  const maximo = Math.max(0, ...items.map((item) => item.valor));

  return (
    <ul aria-label={ariaLabel} className="flex flex-col gap-4">
      {items.map((item) => {
        // un valor positivo muestra siempre un minimo de barra para que se vea
        const porcentaje = maximo > 0 && item.valor > 0 ? Math.max(2, (item.valor / maximo) * 100) : 0;
        return (
          <li key={item.clave} className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-sm">
              <span className="font-semibold text-ink">{item.etiqueta}</span>
              <span className="text-muted">{item.texto}</span>
            </div>
            <div aria-hidden="true" className="h-2.5 w-full overflow-hidden rounded-full bg-linea">
              <div className="h-full rounded-full bg-oro-acento" style={{ width: `${porcentaje}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default BarrasHorizontales;
