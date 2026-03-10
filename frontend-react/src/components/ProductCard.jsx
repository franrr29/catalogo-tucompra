function Card ({producto, addCart}){
    return (
        <div>
            <h1>Producto: {producto.nombre}</h1>
            <p>Precio: {producto.precio}</p>
            <p>Stock disponible: {producto.stock}</p>
            <button onClick={() => addCart(producto.id)}>Agregar al carrito</button>
        </div>
    )
};

export default Card;