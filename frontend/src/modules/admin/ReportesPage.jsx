import { useOutletContext } from "react-router-dom";
import Reportes from "./Reportes";
import PageHeader from "./ui/PageHeader";

// pagina de reportes del panel: cuanto se gano, que se vende mas y a donde se vende
function ReportesPage() {
  const { manejarSesionExpirada } = useOutletContext();

  return (
    <div className="text-ink font-sans antialiased px-4 sm:px-8 py-8 sm:py-10 pb-24">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        <PageHeader titulo="Reportes" descripcion="Rentabilidad, productos más vendidos y ventas por departamento." />

        <Reportes onUnauthorized={manejarSesionExpirada} />
      </div>
    </div>
  );
}

export default ReportesPage;
