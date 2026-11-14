import { useOutletContext } from "react-router-dom";
import Envios from "./Envios";

// pagina de envios del panel: lo que hay que despachar, lo enviado y lo entregado
function EnviosPage() {
  const { manejarSesionExpirada } = useOutletContext();

  return (
    <div className="text-ink font-sans antialiased px-4 sm:px-8 lg:px-12 py-8 pb-24">
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        <section className="border border-border rounded p-6 sm:p-8 bg-white/40 backdrop-blur-sm flex flex-col gap-6 relative shadow-sm">
          <div className="absolute top-0 right-0 w-2 h-2 bg-brand rounded-tr" />
          <div className="flex items-center gap-2 font-sans">
            <span className="w-1.5 h-1.5 bg-brand" />
            <h1 className="text-xs uppercase tracking-widest text-ink font-semibold">Envíos</h1>
          </div>

          <Envios onUnauthorized={manejarSesionExpirada} />
        </section>
      </div>
    </div>
  );
}

export default EnviosPage;
