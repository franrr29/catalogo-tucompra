import { IconoBandeja, IconoAlerta } from "./iconos";

// estado vacio o de error, centrado y con un icono. children son las acciones (por ejemplo el boton Reintentar)
// role: "alert" para errores y "status" para avisos que deben anunciarse; sin role es solo informativo
function EmptyState({ tono = "vacio", titulo, role, children }) {
  const esError = tono === "error";
  const Icono = esError ? IconoAlerta : IconoBandeja;

  return (
    <div role={role} className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
          esError ? "bg-red-100 text-red-700" : "bg-paper text-muted border border-linea"
        }`}
      >
        <Icono className="w-6 h-6" />
      </span>
      <p className={`text-sm max-w-xs ${esError ? "text-red-700" : "text-muted"}`}>{titulo}</p>
      {children}
    </div>
  );
}

export default EmptyState;
