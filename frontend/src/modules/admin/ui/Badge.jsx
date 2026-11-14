// pildora de estado o contador. todas las combinaciones de texto y fondo superan 4.5:1
const VARIANTES = {
  neutro: "bg-superficie border-linea text-ink",
  oro: "bg-oro-suave border-oro-acento/40 text-oro-texto",
  exito: "bg-green-100 border-green-200 text-green-800",
  aviso: "bg-amber-100 border-amber-200 text-amber-800",
  info: "bg-blue-100 border-blue-200 text-blue-800",
  peligro: "bg-red-100 border-red-200 text-red-700",
};

function Badge({ variante = "neutro", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${VARIANTES[variante] || VARIANTES.neutro} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
