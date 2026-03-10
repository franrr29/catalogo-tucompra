import { useEffect } from "react";

function Cart({ fullCart, setCarrito}) {

  function totalCarrito() {
    const sumar = fullCart.reduce((acc, prod) => acc + parseFloat (prod.precio) * prod.cantidad, 0);
    return sumar;
  }

 useEffect(() => {
    
  async function sendProdctsIds() { //ENVIAMOS IDs DE PRODUCTOS A LA RUTA CART.ROUTES.JS QUE LA MANDA A CONTROLLER PARA VERIF
                                    // Y SI HAY STOCK LO AGREGA AL CARRITO

    try {
      const productosIds  = fullCart.map((productos) => productos.id)
      const sendIds = await fetch("http://localhost:4000/api/cart/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productosIds })
      })
      if (!sendIds.ok) {
        throw new Error("Error al mandar los datos al back-end")
      }
      const data = await sendIds.json()
      setCarrito(data.carrito.map ((item)=>{
        const cantidades= fullCart.find (cantidad => cantidad.id === item.id)
         const cantidad = cantidades ? cantidades.cantidad : 1;
         return {...item, cantidad}
      }))
    }
    catch (error) {
      console.error("Error al enviar los ids al back-end")
    }
  }
  sendProdctsIds()
}, []) 


  //FUNCION AUMENTAR CANTIDAD DEL PRODUCTO +:

  function aumentar (id){

   setCarrito((actualCart) =>
  actualCart.map((item) =>
    item.id === id
      ? { ...item, cantidad: item.cantidad + 1 }
      : item
  )
);
  }

  //FUNCION DISMINUIR CANTIDAD DEL PRODUCTO -:

  function disminuir (id){

    const producto= fullCart.find (item =>item.id ===id)
    if (producto.cantidad ===1){
      eliminar (id)
    } else {
      setCarrito ((actualCart)=>
    actualCart.map ((item)=>
    item.id ===id
    ? {...item, cantidad: item.cantidad -1}
    : item))
    }
  }

  //FUNCION ELIMINAR TOTALMENTE EL PRODUCTO DEL CARRITO CUANDO LLEGA A 0:

  function eliminar (id){
    const eliminarProd=fullCart.filter (item => item.id !==id)
    setCarrito(eliminarProd)
  }

  //FUNCION ARMAR PEDIDO Y ENVIAR A WHATSAPP PARA COMPLETAR COMPRA:

  function whatsapp (){
    const productos = fullCart.map(prod => `${prod.nombre} x${prod.cantidad} - $${prod.precio}`).join("\n")
    const mensaje= `Buenas! Quiero finalizar este pedido:\n${productos}\nTotal: $${totalCarrito()}`
    window.open(`https://wa.me/59891637161?text=${encodeURIComponent(mensaje)}`)
  }
  

  return (
    <div>
      <h1>Mi carrito:</h1>

      {fullCart.length === 0 ? (
        "Carrito vacío"
      ) : (
        <>
          {fullCart.map((producto) => (
            <div key={producto.id}>
              <p>Producto: {producto.nombre}</p>
              <p>Precio: {producto.precio}</p>
              <p>Cantidad: {producto.cantidad}</p>
              <button onClick={()=> aumentar (producto.id)}>+</button>
              <button onClick={()=>disminuir (producto.id)}>-</button>
              <button onClick={()=> eliminar (producto.id)}>Eliminar</button>
            </div>
          ))}

          <h2>Total del carrito: {totalCarrito()}</h2>
          <button onClick={()=> whatsapp()}>Finalizar compra</button>
        </>
      )}
    </div>
  );
}

export default Cart;