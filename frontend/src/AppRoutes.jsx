import Navbar from "./shared/Navbar";
import Footer from "./shared/Footer";
import ListaProductos from "./modules/products/productsList";
import Cart from "./modules/cart/Cart";
import Admin from "./modules/admin/Admin.jsx";
import Dashboard from "./modules/admin/Dashboard.jsx";
import RutaProtegida from "./modules/admin/RutaProtegida.jsx";
import NotFound from "./shared/NotFound.jsx";
import ProductoDetalle from "./modules/products/ProductoDetalle.jsx";
import ComoComprar from "./shared/ComoComprar.jsx";
import Contacto from "./shared/Contacto.jsx";
import "./shared/styles/Navbar.css";
import { Toaster } from "react-hot-toast";
import { Routes, Route } from "react-router-dom";

// arma el layout general de la app (navbar, contenido, footer) y define las rutas
// la sesion del admin no se pasa por props: cada pantalla la lee del AuthContext con useAuth()
function AppRoutes({ carrito, setCarrito, addCart }) {
  return (
    <div className="min-h-screen bg-[#F4F4F2] text-[#111111] flex flex-col font-sans selection:bg-[#E2E2DF]">
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
        }}
      />

      <Navbar cartCounter={carrito.length} />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<ListaProductos addCart={addCart} />} />
          <Route path="/carrito" element={<Cart fullCart={carrito} setCarrito={setCarrito} />} />
          <Route path="/admin/login" element={<Admin />} />
          <Route path="/admin/dashboard" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
          <Route path="/como-comprar" element={<ComoComprar />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/producto/:id" element={<ProductoDetalle addCart={addCart} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default AppRoutes;
