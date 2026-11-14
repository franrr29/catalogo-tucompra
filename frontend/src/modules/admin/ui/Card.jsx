// contenedor del panel: tarjeta redondeada con borde sutil y sombra suave
export function Card({ as: Etiqueta = "section", className = "", children, ...props }) {
  return (
    <Etiqueta
      className={`bg-superficie border border-linea rounded-tarjeta shadow-tarjeta p-5 sm:p-7 ${className}`}
      {...props}
    >
      {children}
    </Etiqueta>
  );
}

// titulo de una tarjeta, con un punto dorado fino de acento (decorativo)
export function CardTitle({ as: Nivel = "h2", children, ...props }) {
  return (
    <Nivel className="flex items-center gap-2.5 text-base font-semibold text-ink" {...props}>
      <span className="w-2 h-2 rounded-full bg-oro-acento shrink-0" aria-hidden="true" />
      {children}
    </Nivel>
  );
}
