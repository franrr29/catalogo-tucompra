//===COMPONENTES CREADOS===//

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ListaProductos from "./components/productsList";
import Cart from "./components/Cart";
import Admin from "./components/styles/pages/Admin.jsx";
import Dashboard from "./components/styles/pages/Dashboard.jsx";
import RutaProtegida from "./components/styles/pages/RutaProtegida.jsx";
import NotFound from "./components/NotFound.jsx";
import ProductoDetalle from "./components/ProductoDetalle.jsx";
import ComoComprar from "./components/ComoComprar.jsx";
import Contacto from "./components/Contacto.jsx";

import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./components/styles/Navbar.css";
import toast, { Toaster } from 'react-hot-toast'
import { API_URL } from "./config.js";



//===FUNCION PRINCIPAL, CONTROLA CARRITO, PETICION AL BACK Y RENDERIZA COMPONENTES===//

function App() {
 const [carrito, setCarrito]= useState ([])
 const [isLogIn, setIsLogIn]= useState (false)
 const [loading, setLoading]=useState (true)

  //AL MONTAR CARGA EL CARRITO GUARDADO UNA VEZ, BUSCA EL TOKEN PARA LOGGEAR Y MANDA AL NAVBAR DATOS:
  useEffect (()=>{
    const token= localStorage.getItem ("token")
    const carritoGuardado= localStorage.getItem ("productos")
    if (carritoGuardado !== null){
      setCarrito (JSON.parse (carritoGuardado))
    }
    if (token){
      setIsLogIn (true)
    }
    setLoading (false)
  },[])

  //FUNCION PARA MANEJAR EL LOGOUT, ACTUALIZAR EL ESTADO Y VA COMO PROP EN NAVBAR:
  function handleLogOut (){
    localStorage.removeItem ("token")
    setIsLogIn (false)
  }

  //FUNCION ACTUALIZA LOGIN Y PASA COMO PROP A ADMIN.JSX:
  function handleLogIn (){
    setIsLogIn (true)
  }

  //GUARDAMOS EN LOCALSTORAGE EL CARRITO DEL USUARIO:
  useEffect (()=>{
  localStorage.setItem ("productos", JSON.stringify (carrito))
  }, [carrito]);


 async function addCart(productId) {  
  
  try {
    const sendRequest= await fetch (API_URL + "/api/cart/add",
      {
        method: "POST",
        headers: {"Content-Type" : "application/json"},
        body: JSON.stringify({productId})
      }
    )
    
    if (!sendRequest.ok){
      throw new Error ("Error al mandar el producto al Back-end")
    }
    
    const data= await sendRequest.json ()

    //FILTRAR PRODUCTO, CREAR CANTIDAD Y SUMAR O AGREGAR POR PRIMERA VEZ
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
      background: '#f59e0b',
      color: '#fff',
      border: 'none',
      fontWeight: 'bold',
    }
})

  } catch (error){
    console.error ("Error al enviar la peticion al Back-end")
    toast ("Error al agregar producto")
  }
 }

  return (
    <BrowserRouter>
    <div className="App">
      <Toaster/>
      <Navbar cartCounter={carrito.length} isLogIn={isLogIn} handleLogOut={handleLogOut}/>
      
      <Routes>
      <Route path="/" element={<ListaProductos addCart={addCart} isLogIn={isLogIn}/>} />
      <Route path="/carrito" element= {<Cart fullCart={carrito} setCarrito={setCarrito}/>}/>
      
      <Route path= "/admin/login" element= {<Admin handleLogIn={handleLogIn}/>}/>
      <Route path="/admin/dashboard" element={<RutaProtegida isLogIn={isLogIn} loading={loading}><Dashboard isLogIn={isLogIn}/></RutaProtegida>}/>
      <Route path="*" element={<NotFound/>}></Route>
      <Route path="/como-comprar" element={<ComoComprar/>}/>
      <Route path="/contacto" element={<Contacto/>}/>
      <Route path="/producto/:id" element={<ProductoDetalle addCart={addCart}/>}/>
      </Routes>
      
      <Footer />
    </div>
    </BrowserRouter>
  );
}

export default App;