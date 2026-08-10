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
import toast, { Toaster } from 'react-hot-toast';
import { API_URL } from "./config.js";
import { agregarAlCarrito } from "./modules/cart/cart.service";
import { AuthProvider } from "./modules/admin/AuthContext";

import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const guardarPosicion = () => {
      sessionStorage.setItem(`scroll:${pathname}`, String(window.scrollY));
    };

    if (navigationType === "POP") {
      const guardada = sessionStorage.getItem(`scroll:${pathname}`);
      if (guardada !== null) {
        const y = Number(guardada);
        window.scrollTo(0, y);
        const reintento = setTimeout(() => window.scrollTo(0, y), 250);
        window.addEventListener("beforeunload", guardarPosicion);
        return () => {
          clearTimeout(reintento);
          guardarPosicion();
          window.removeEventListener("beforeunload", guardarPosicion);
        };
      }
    }

    window.scrollTo(0, 0);
    window.addEventListener("beforeunload", guardarPosicion);
    return () => {
      guardarPosicion();
      window.removeEventListener("beforeunload", guardarPosicion);
    };
  }, [pathname, navigationType]);

  return null;
}

function AppBody({ carrito, setCarrito, isLogIn, loading, handleLogOut, handleLogIn, addCart }) {
  return (
    <div className="min-h-screen bg-[#F4F4F2] text-[#111111] flex flex-col font-sans selection:bg-[#E2E2DF]">
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
        }}
      />

      <Navbar cartCounter={carrito.length} isLogIn={isLogIn} handleLogOut={handleLogOut} />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<ListaProductos addCart={addCart} isLogIn={isLogIn} />} />
          <Route path="/carrito" element={<Cart fullCart={carrito} setCarrito={setCarrito} />} />
          <Route path="/admin/login" element={<Admin handleLogIn={handleLogIn} />} />
          <Route path="/admin/dashboard" element={<RutaProtegida isLogIn={isLogIn} loading={loading}><Dashboard isLogIn={isLogIn} /></RutaProtegida>} />
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

function App() {
  const [carrito, setCarrito] = useState([]);
  const [isLogIn, setIsLogIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const carritoGuardado = localStorage.getItem("productos");
    if (carritoGuardado !== null) {
      setCarrito(JSON.parse(carritoGuardado));
    }
    if (token) {
      setIsLogIn(true);
    }
    setLoading(false);
    fetch(API_URL + "/api/productos").catch(() => {});
  }, []);

  function handleLogOut() {
    localStorage.removeItem("token");
    setIsLogIn(false);
  }

  function handleLogIn() {
    setIsLogIn(true);
  }

  useEffect(() => {
    localStorage.setItem("productos", JSON.stringify(carrito));
  }, [carrito]);

  async function addCart(productId) {
    try {
      const data = await agregarAlCarrito(productId);

      const findProdCart = carrito.find(item => item.id === data.producto.id);

      if (!findProdCart) {
        setCarrito(prevCart => [...prevCart, { ...data.producto, cantidad: 1 }]);
      } else {
        setCarrito(prevCart =>
          prevCart.map(item =>
            item.id === data.producto.id
              ? { ...item, cantidad: item.cantidad + 1 }
              : item
          )
        );
      }

      toast.success("Producto agregado", {
        style: {
          background: '#F4F4F2',
          color: '#111111',
          border: '1px solid #CCCCCC',
          borderRadius: '0px',
          fontFamily: 'sans-serif',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
        iconTheme: {
          primary: '#C89211',
          secondary: '#F4F4F2',
        },
      });

    } catch (error) {
      console.error("Error al enviar la peticion al Back-end");
      toast("Error al agregar producto", {
        style: {
          background: '#F4F4F2',
          color: '#111111',
          border: '1px solid #CCCCCC',
          borderRadius: '0px',
          fontFamily: 'sans-serif',
          fontSize: '12px',
          textTransform: 'uppercase',
        }
      });
    }
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppBody
          carrito={carrito}
          setCarrito={setCarrito}
          isLogIn={isLogIn}
          loading={loading}
          handleLogOut={handleLogOut}
          handleLogIn={handleLogIn}
          addCart={addCart}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
