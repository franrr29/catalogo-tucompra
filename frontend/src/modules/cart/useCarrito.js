import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { agregarAlCarrito } from "./cart.service";

// maneja el estado del carrito, lo guarda en el navegador y agrega productos
export function useCarrito() {
  const [carrito, setCarrito] = useState([]);

  // al iniciar, recupera el carrito guardado del navegador
  useEffect(() => {
    const carritoGuardado = localStorage.getItem("productos");
    if (carritoGuardado !== null) {
      setCarrito(JSON.parse(carritoGuardado));
    }
  }, []);

  // cada vez que cambia el carrito, lo vuelve a guardar
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

  return { carrito, setCarrito, addCart };
}
