import { useState, useEffect } from "react";
import Card from "./ProductCard";

function ListaProductos({ addCart }) {
    const [productos, setProductos] = useState([]);
    const [precioMax, setPrecioMax]= useState (Infinity) 
    //Mostramos un valor grande para que luego se aplique la logica si el usuari desea

    //Array productos filtrados:
    const productosFiltrados=productos.filter (precio => precio.precio < precioMax)
        


    useEffect(() => {
        async function obtenerProducts() {
            try {
                const resp = await fetch("http://127.0.0.1:4000/api/productos")
                if (!resp.ok) throw new Error("Error en la respuesta del servidor");

                const data = await resp.json();
                setProductos(data);
            } catch (error) {
                console.error("Error al traer los productos", error);
            }
        }
        obtenerProducts();
    }, []);

    return (
        <div>
            <h1 className="text-red-500">Lista de productos:</h1>
            {productosFiltrados.map((prod) => (
                <Card key={prod.id} producto={prod} addCart={addCart} />
            ))}

            <h1>Filtrar por precio</h1>
            <input type="number"
            placeholder="Ingresa un valor deseado"
            onChange={(e)=> setPrecioMax (Number (e.target.value) || Infinity)}/>            
        </div>
        //si el usuario borra el input queda Number("") = 0 y no muestra nada, Infinity renderiza todos los valores.
    );
}

export default ListaProductos;