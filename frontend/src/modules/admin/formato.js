// formatos compartidos por las paginas del panel (fechas y montos en es-UY)

export function formatearFecha(fecha) {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatearMonto(valor) {
  return `$${Number(valor).toLocaleString("es-UY", { maximumFractionDigits: 2 })}`;
}

// porcentaje con hasta 1 decimal y coma decimal (es-UY)
export function formatearPorcentaje(valor) {
  return `${Number(valor).toLocaleString("es-UY", { maximumFractionDigits: 1 })}%`;
}
