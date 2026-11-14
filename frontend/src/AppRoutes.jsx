import Navbar from "./shared/Navbar";
import Footer from "./shared/Footer";
import ListaProductos from "./modules/products/ListaProductos";
import Cart from "./modules/cart/Cart";
import Admin from "./modules/admin/Admin.jsx";
import AdminLayout from "./modules/admin/AdminLayout.jsx";
import ProductosPage from "./modules/admin/ProductosPage.jsx";
import VentasPage from "./modules/admin/VentasPage.jsx";
import EnviosPage from "./modules/admin/EnviosPage.jsx";
import ReportesPage from "./modules/admin/ReportesPage.jsx";
import RutaProtegida from "./modules/admin/RutaProtegida.jsx";
import NotFound from "./shared/NotFound.jsx";
import ProductoDetalle from "./modules/products/ProductoDetalle.jsx";
import ComoComprar from "./shared/ComoComprar.jsx";
import Contacto from "./shared/Contacto.jsx";
import { Toaster } from "react-hot-toast";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Checkout from "./modules/pagos/Checkout.jsx";
import Exito from "./modules/pagos/Exito.jsx";
import CompraFallida from "./modules/pagos/Fallido.jsx";
import PagoPendiente from "./modules/pagos/Pendiente.jsx";

// arma el layout general de la app navbar, contenido, footer y define las rutas
// la sesion del admin no se pasa por props cada pantalla la lee del authcontext con useauth()
function AppRoutes({ carrito, setCarrito, addCart }) {
  const { pathname } = useLocation();
  // el panel de administracion tiene su propio menu y su barra superior: no lleva el navbar ni el footer de la tienda
  // (el login si, porque todavia es una pantalla publica)
  const enPanel = (pathname === "/admin" || pathname.startsWith("/admin/")) && pathname !== "/admin/login";

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans selection:bg-[#E2E2DF]">
      <Toaster
        position="top-center"
        gutter={10}
        toastOptions={{
          duration: 3500,
          style: {
            background: "rgba(244, 244, 242, 0.85)",
            backdropFilter: "blur(12px)",
            color: "#111111",
            border: "1px solid rgba(26,26,26,0.12)",
            borderRadius: "12px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontFamily: "sans-serif",
            padding: "14px 18px",
          },
          success: {
            iconTheme: { primary: "#C89211", secondary: "#F4F4F2" },
          },
          error: {
            iconTheme: { primary: "#dc2626", secondary: "#F4F4F2" },
            style: { border: "1px solid rgba(220,38,38,0.25)" },
          },
        }}
      />

      {!enPanel && <Navbar cartCounter={carrito.length} />}

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<ListaProductos addCart={addCart} />} />
          <Route path="/carrito" element={<Cart fullCart={carrito} setCarrito={setCarrito} />} />
          <Route path="/admin/login" element={<Admin />} />
          <Route path="/admin" element={<RutaProtegida><AdminLayout /></RutaProtegida>}>
            <Route index element={<Navigate to="productos" replace />} />
            <Route path="productos" element={<ProductosPage />} />
            <Route path="ventas" element={<VentasPage />} />
            <Route path="envios" element={<EnviosPage />} />
            <Route path="reportes" element={<ReportesPage />} />
          </Route>
          {/* la ruta vieja sigue funcionando para no romper favoritos */}
          <Route path="/admin/dashboard" element={<Navigate to="/admin/productos" replace />} />
          <Route path="/como-comprar" element={<ComoComprar />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/producto/:id" element={<ProductoDetalle addCart={addCart} />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pago-exitoso" element={<Exito setCarrito={setCarrito} />} />
          <Route path="/pago-fallido" element={<CompraFallida />} />
          <Route path="/pago-pendiente" element={<PagoPendiente />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!enPanel && <Footer />}
    </div>
  );
}

export default AppRoutes;
