import { useOutletContext } from "react-router-dom";
import Ventas from "./Ventas";
import { Card } from "./ui/Card";
import PageHeader from "./ui/PageHeader";

// pagina de ventas del panel: el listado de pedidos con el detalle desplegable de cada uno
function VentasPage() {
  const { manejarSesionExpirada } = useOutletContext();

  return (
    <div className="text-ink font-sans antialiased px-4 sm:px-8 py-8 sm:py-10 pb-24">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        <PageHeader titulo="Ventas" descripcion="Pedidos de la tienda y el detalle de cada uno." />

        <Card>
          <Ventas onUnauthorized={manejarSesionExpirada} />
        </Card>
      </div>
    </div>
  );
}

export default VentasPage;
