//===COMPONENTES CREADOS===//

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ListaProductos from "./components/productsList";
import Cart from "./components/Cart";
import Admin from "./components/styles/pages/Admin.jsx";
import Dashboard from "./components/styles/pages/Dashboard.jsx";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./components/styles/Navbar.css";


//=== FUNCION PRINCIPAL, CONTROLA CARRITO, PETICION AL BACK Y RENDERIZA COMPONENTES===//
function App() {
 const [carrito, setCarrito]= useState ([])


  //AL MONTAR CARGA EL CARRITO GUARDADO UNA VEZ:
  useEffect (()=>{
    const carritoGuardado= localStorage.getItem ("productos")
    if (carritoGuardado !== null){
      setCarrito (JSON.parse (carritoGuardado))
    }
  },[])

  //GUARDAMOS EN LOCALSTORAGE EL CARRITO DEL USUARIO:
  useEffect (()=>{
  localStorage.setItem ("productos", JSON.stringify (carrito))
  }, [carrito]);


 async function addCart(productId) {  

  try {
    const sendRequest= await fetch ("http://localhost:4000/api/cart/add", //Este POST llega a cart.services.js
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



  } catch (error){
    console.error ("Error al enviar la peticion al Back-end")
  }
  
 }
    
  return (
    <BrowserRouter>
    <div className="App">
      <Navbar cartCounter={carrito.length}/>

      <header className="App-header">
        <h1>Tu Compra</h1>
      </header>
      <Routes>
      <Route path="/" element={<ListaProductos addCart={addCart}/>} />
      <Route path="/carrito" element= {<Cart fullCart={carrito} setCarrito={setCarrito}/>}/>
      <Route path= "/admin/login" element= {<Admin/>}/>
      <Route path="/admin/dashboard" element={<Dashboard/>} />
      </Routes>
      
      <Footer />
    </div>
    </BrowserRouter>
  );
}

export default App;