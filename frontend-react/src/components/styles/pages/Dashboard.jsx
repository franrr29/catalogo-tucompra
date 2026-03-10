import { useState, useEffect } from "react";  
import { useNavigate } from "react-router-dom"; 
import { useRef } from "react"; 
import Card from "../../ProductCard";

function Dashboard (){
    const [control, setControl] = useState({nombre: "", precio: "", stock: "", imagen: ""})
    const [productos, setProductos] = useState([])
    const [patchDatos, setPatchDatos] = useState({nombre: "", precio: "", stock: "", imagen: ""})
    const [idPatch, setIdPatch] = useState(null)
    const navigate = useNavigate()
    const timerRef= useRef (null)


    //Funciones de resetear tiempo, logout, limpiar settimeout y redirigir a login:
    
    function resetearTimer(){
        clearTimeout (timerRef.current)
        timerRef.current= setTimeout (()=>{
            adminLogOut ()
        }, 15000)
    }

    useEffect (()=>{
        window.addEventListener ("click", resetearTimer)
        window.addEventListener ("keydown", resetearTimer)
        window.addEventListener ("mousemove", resetearTimer);

        resetearTimer ();

        return () =>{
        window.removeEventListener("click", resetearTimer);
        window.removeEventListener("keydown", resetearTimer);
        window.removeEventListener("mousemove", resetearTimer);

       clearTimeout(timerRef.current)
        }

        
    }, [])
    

    function resetForm(){
        setControl({nombre: "", precio: "", stock: "", imagen: ""})
    }

    //Reset patch form
    function resetPatchForm (){
        setPatchDatos ({nombre: "", precio: "", stock: "", imagen: ""})
            setIdPatch (null)
    }

    //Borrar token y redirigir ADMIN:
    function adminLogOut (){
        localStorage.removeItem ("token")
        navigate ("admin/login");
    }



    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/admin/login");
            return;
        }

        async function getProductos() { 
            try {
                const renderProducts = await fetch("http://localhost:4000/api/productos", {
                    method: "GET",
                    headers: { "Content-Type": "application/json" }
                });
                const data = await renderProducts.json();
                setProductos(data);
            } catch (error) {
                console.error("Error al hacer GET en la API");
            }
        }

        getProductos();
    }, []);

    // Crear producto nuevo como ADMIN:
    async function newProduct() {
        try {
            const sendProduct = await fetch("http://localhost:4000/api/productos", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(control)
            })
            if (!sendProduct.ok){
                throw new Error("Error al tratar de crear un producto nuevo")
            }
            resetForm();
        } catch (error){
            console.error("Error al tratar de enviar el pedido")
        }
    }

    // Borrar producto como ADMIN:
    async function deleteProdct(id) {
        try {
            const borrar = await fetch(`http://localhost:4000/api/productos/${id}`, {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
            })
            if (!borrar.ok){
                throw new Error("Error al tratar de eliminar el producto")
            }
            const filtrarProductos = productos.filter(item => item.id !== id)
            setProductos(filtrarProductos)
        } catch (error){
            console.error("Error al tratar de borrar producto")
        }
    }

    // Actualizar producto como ADMIN:
    async function patchProduct(id) {
        try {
            // Solo mandamos los campos que el usuario completó, los vacíos los ignoramos
            const soloRellenos = Object.fromEntries(
                Object.entries(patchDatos).filter(([clave, valor]) => valor !== "")
            );

            const actualizar = await fetch(`http://localhost:4000/api/productos/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(soloRellenos)
            });
            if (!actualizar.ok) {
                throw new Error("Error al tratar de modificar el producto");
            }
            const actualizarDatos = productos.map((prod) => {
                if (prod.id === id) {
                    return { ...prod, ...patchDatos };
                } else {
                    return prod;
                }
            });
            setProductos(actualizarDatos);
            setIdPatch(null); // cierra el panel de edicion
            setPatchDatos({nombre: "", precio: "", stock: "", imagen: ""}); // resetea el form
        } catch (error) {
            console.error("Error al conectar con la API");
        }
    }

    return (
       <div>
            <h1>Nuevo producto</h1>
            <input
                type="text"
                placeholder="Nombre"
                value={control.nombre}
                onChange={(e) => setControl({ ...control, nombre: e.target.value })}/>

            <input type="number"
                placeholder="Ingresa el precio"
                value={control.precio}
                onChange={(e) => setControl({...control, precio: e.target.value})}/>

            <input type="number"
                placeholder="Stock"
                value={control.stock}
                onChange={(e) => setControl({...control, stock: e.target.value})}/>

            <input type="text"
                placeholder="Imagen"
                value={control.imagen}
                onChange={(e) => setControl({...control, imagen: e.target.value})}/>

            <button onClick={newProduct}>Crear</button>

            <div>
                <h2>Panel de productos del administrador:</h2>
                {productos.map((item) => (
                    <div key={item.id}>
                        <Card producto={item}/>
                        <button onClick={() => deleteProdct(item.id)}>Eliminar producto</button>
                        <button onClick={() => setIdPatch(item.id)}>Editar producto</button>

                        {idPatch === item.id && (
                            <div>
                                <input type="text"
                                    placeholder="Nuevo nombre"
                                    value={patchDatos.nombre}
                                    onChange={(e) => setPatchDatos({...patchDatos, nombre: e.target.value})}/>

                                <input type="number"
                                    placeholder="Nuevo precio"
                                    value={patchDatos.precio}
                                    onChange={(e) => setPatchDatos({...patchDatos, precio: e.target.value})}/>

                                <input type="number"
                                    placeholder="Nuevo stock"
                                    value={patchDatos.stock}
                                    onChange={(e) => setPatchDatos({...patchDatos, stock: e.target.value})}/>

                                <input type="text"
                                    placeholder="Nueva imagen"
                                    value={patchDatos.imagen}
                                    onChange={(e) => setPatchDatos({...patchDatos, imagen: e.target.value})}/>

                                <button onClick={() => patchProduct(item.id)}>Actualizar</button>
                                <button onClick={() => resetPatchForm ()}>Cancelar</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Dashboard;