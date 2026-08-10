import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import ScrollToTop from "./shared/ScrollToTop";
import AppRoutes from "./AppRoutes";
import { useCarrito } from "./modules/cart/useCarrito";
import { AuthProvider } from "./modules/admin/AuthContext";
import { API_URL } from "./config.js";

function App() {
  const { carrito, setCarrito, addCart } = useCarrito();

  // despierta al backend apenas se abre la app, porque esta en un hosting gratuito que se duerme solo
  useEffect(() => {
    fetch(API_URL + "/api/productos").catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppRoutes carrito={carrito} setCarrito={setCarrito} addCart={addCart} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
