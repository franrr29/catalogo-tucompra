import { useOutletContext } from "react-router-dom";
import Envios from "./Envios";
import { Card } from "./ui/Card";
import PageHeader from "./ui/PageHeader";

// pagina de envios del panel: lo que hay que despachar, lo enviado y lo entregado
function EnviosPage() {
  const { manejarSesionExpirada } = useOutletContext();

  return (
    <div className="text-ink font-sans antialiased px-4 sm:px-8 py-8 sm:py-10 pb-24">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        <PageHeader titulo="Envíos" descripcion="Lo que hay que despachar, lo enviado y lo entregado." />

        <Card>
          <Envios onUnauthorized={manejarSesionExpirada} />
        </Card>
      </div>
    </div>
  );
}

export default EnviosPage;
