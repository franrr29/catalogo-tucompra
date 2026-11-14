// estado de carga: texto anunciado a lectores de pantalla y filas de esqueleto (decorativas)
// el pulso se apaga con prefers-reduced-motion
function CargandoEstado({ texto, filas = 3 }) {
  return (
    <div className="flex flex-col gap-3 py-2">
      <p role="status" className="text-sm text-muted text-center">
        {texto}
      </p>
      <div aria-hidden="true" className="flex flex-col gap-2.5">
        {Array.from({ length: filas }, (_, i) => (
          <div key={i} className="h-12 rounded-control bg-linea/70 animate-pulse motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}

export default CargandoEstado;
