import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Card from "../../ProductCard";
import CrearNuevoProdct from "./AdminCreateProduct";
import EditarProductoAdmin from "./EditarProducto";
import { API_URL } from "../../../config";
import { toast } from 'react-hot-toast'

function Dashboard({isLogIn}) {
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: "", precio: "", stock: "", imagen: "" });
  const [productos, setProductos] = useState([]);
  const [actualizarDatos, setActualizarDatos] = useState({ nombre: "", precio: "", stock: "", imagen: "" });
  const [idProductoEditado , setIdProductoEditado ] = useState(null);
  const [fotosSeleccionadas, setFotosSeleccionadas]= useState (null);
  const [imagenesEditor, setImagenesEditor] = useState([]);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  //LÓGICA DE SESIÓN Y SEGURIDAD

  function resetearTimer() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      adminLogOut();
    }, 15 * 60 * 1000); // 15 minutos
  }

  function adminLogOut() {
    localStorage.removeItem("token");
    navigate("/admin/login");
  }

  //===FUNCION PARA CARGAR IMAGENES COMO ADMIN===//

  async function subirFotos(productoId){
    const formData= new FormData ()
    Array.from(fotosSeleccionadas).forEach(file => { 
    formData.append("imagenes", file)
})
    try {
      const res= await fetch (`${API_URL}/api/imagenes/${productoId}`, {
        method: "POST",
        headers: { 
        "Authorization": localStorage.getItem("token")
      },
        body: formData
      });

      if (res.status === 401){
        adminLogOut ()
        return
      }

      const data= await res.json()
      console.log (data)
      
    } catch (error){
      console.error ("Error al cargar las fotos", error)
    }
  }

  async function abrirPanelEdicion(id) {
    try {
      setIdProductoEditado  (id)
      const res= await fetch (`${API_URL}/api/productos/${id}`)
      const data= await res.json ();
      setImagenesEditor (data.imagenes)
    } catch (error){
      console.error ("Error al cargar las imagenes del editor", error)
    }
  }

  useEffect(() => {
    const eventos = ["click", "keydown", "mousemove"];
    eventos.forEach(e => window.addEventListener(e, resetearTimer));
    resetearTimer();

    const token = localStorage.getItem("token");
    if (!token) return navigate("/admin/login");

    getProductos ();
    return () => {
      eventos.forEach(e => window.removeEventListener(e, resetearTimer));
      clearTimeout(timerRef.current);
    };
  }, []);

  //===LOGICA CRUD DEL ADMIN===//

  async function crearNuevoProdct() {
    if (!nuevoProducto.nombre || !nuevoProducto.precio || !nuevoProducto.stock) {
      toast.error("Debes completar nombre, precio y stock");
      return;
    }

    try {
      const datosProducto = {
        nombre: nuevoProducto.nombre.trim(),
        precio: Number(nuevoProducto.precio),
        stock: Number(nuevoProducto.stock),
        imagen: nuevoProducto.imagen.trim() || null
      };

      const resp = await fetch(API_URL + "/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json",
        "Authorization": localStorage.getItem("token")
         },
        body: JSON.stringify(datosProducto)
      });

      if (resp.status === 401){
      adminLogOut ()
      return
    }

      const data = await resp.json();
      console.log(data);

      if (resp.ok) {
        setProductos([...productos, { ...datosProducto, id: data.id }]); 
        setNuevoProducto({ nombre: "", precio: "", stock: "", imagen: "" });
        if (fotosSeleccionadas !== null) {
        await subirFotos(data.id)
        setFotosSeleccionadas (null)
        toast.success ("Producto creado", {
          style:  {
          background: '#f59e0b',
          color: '#fff',
          border: 'none',
          fontWeight: 'bold',
          }
        })}
      }

    } catch (error) {
      console.error("Error al crear el producto", error);
      toast.error ("Error al crear el producto", {
          style:  {
          background: '#bc0a0a',
          color: '#fff',
          border: 'none',
          fontWeight: 'bold',
          }
        });
    }
  }

   async function getProductos() {
      try {
        const resp = await fetch(API_URL + "/api/productos");
        const data = await resp.json();
        setProductos(data);
      } catch (error) {
        console.error("Error al traer productos");
      }
    }
    
  async function borrarProducto(id) {
    if (!window.confirm("Eliminar producto?")) return;
    try {
      const resp = await fetch(`${API_URL}/api/productos/${id}`, { method: "DELETE" ,
        headers: { 
        "Content-Type": "application/json",
        "Authorization": localStorage.getItem("token")
      }
      });

      if (resp.status === 401){
      adminLogOut ()
      return
    }
      if (resp.ok){

       setProductos(productos.filter(item => item.id !== id))
       toast.success ("Producto eliminado", {
          style:  {
          background: '#bc0a0a',
          color: '#fff',
          border: 'none',
          fontWeight: 'bold',
          }
        });}
        
      

    } catch (error) { console.error("Error al borrar"); 
      toast.error ("Error al eliminar", {
          style:  {
          background: '#bc0a0a',
          color: '#fff',
          border: 'none',
          fontWeight: 'bold',
          }
        });
    }
  }

  async function actualizarProducto(id) {
    try {
      const soloRellenos = Object.fromEntries(
        Object.entries(actualizarDatos).filter(([_, valor]) => valor !== "")
      );
      const resp = await fetch(`${API_URL}/api/productos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" ,
        "Authorization": localStorage.getItem("token")
        },
        body: JSON.stringify(soloRellenos)
      });

      if (resp.status === 401){
      adminLogOut ()
      return
    }

      if (resp.ok) {
        setProductos(productos.map(p => p.id === id ? { ...p, ...soloRellenos } : p));
        setIdProductoEditado (null);
        setActualizarDatos({ nombre: "", precio: "", stock: "", imagen: "" });
        if (fotosSeleccionadas !== null){
        await subirFotos(id)
      }
      setFotosSeleccionadas(null)
      toast.success ("Producto actualizado", {
          style:  {
          background: '#0c09c6',
          color: '#fff',
          border: 'none',
          fontWeight: 'bold',
          }
        });
      }

    } catch (error) { console.error("Error al actualizar"); 
      toast.error ("Error al actualizad", {
          style:  {
          background: '#bc0a0a',
          color: '#fff',
          border: 'none',
          fontWeight: 'bold',
          }
        });
    }
  }

  async function marcarPrincipal(imagenId, productoId) {
    try {
      const res= await fetch (`${API_URL}/api/imagenes/${imagenId}`,{
        method: "PATCH",
        headers: { 
        "Content-Type": "application/json",
        "Authorization": localStorage.getItem("token"),
      }
      
    });

    if (res.status === 401){
      adminLogOut ()
      return
    }

      const data= await res.json ()
      console.log (data)
      abrirPanelEdicion (productoId)
      getProductos ()
      toast.success ("Imagen agregada como portada", {
          style:  {
          background: '#100e6e',
          color: '#fff',
          border: 'none',
          fontWeight: 'bold',
          }
        });
    } catch (error){
      console.error ("Error al tratar de marcar imagen de portada", error)
    }
  }

  //BORRAR UNA FOTO COMO ADMIN:
  async function borrarUnaFoto (imagenId){
    try {
      const res= await fetch (API_URL + `/api/imagenes/${imagenId}`, {
        method: "DELETE",
        headers: {
        "Content-Type": "application/json",
        "Authorization": localStorage.getItem("token")
        }
      });

      if (res.status === 401){
          adminLogOut ()
          return;
        }

      if (res.ok){
        setImagenesEditor (imagenesEditor.filter (imagen => imagen.id !==imagenId));
        getProductos ()
        toast.success ("Imagen eliminada", {
          style:  {
          background: '#080740',
          color: '#fff',
          border: 'none',
          fontWeight: 'bold',
          }
        });
      }



    } catch (error){
      console.error ("Error al eliminar la imagen", error)
      toast.error ("Error al tratar de eliminar la foto", {
          style:  {
          background: '#050430',
          color: '#fff',
          border: 'none',
          fontWeight: 'bold',
          }
        });
    }
  }

  const inputClass = "bg-white/5 border border-white/10 text-white text-xs px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-all placeholder-gray-700 w-full";
  const btnPrimary = "bg-white text-black text-[10px] font-bold tracking-widest uppercase px-6 py-3 hover:bg-amber-500 transition-all";
  const btnDanger = "border border-red-900/50 text-red-500 text-[9px] tracking-widest uppercase px-4 py-2 hover:bg-red-900 hover:text-white transition-all";
  const btnSecondary = "border border-white/10 text-gray-400 text-[9px] tracking-widest uppercase px-4 py-2 hover:border-white hover:text-white transition-all";

  return (
    <div className="min-h-screen bg-black text-white px-8 py-24">
      
      {/* HEADER DASHBOARD */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
        <div>
          <h1 className="text-2xl font-light tracking-[0.4em] uppercase">Control de <span className="text-amber-500 font-bold">Inventario</span></h1>
          <div className="w-16 h-px bg-amber-500 mt-2" />
        </div>
      </motion.div>

       <CrearNuevoProdct 
      nuevoProducto={nuevoProducto}
      setNuevoProducto={setNuevoProducto}
      setFotosSeleccionadas={setFotosSeleccionadas}
      crearNuevoProducto={crearNuevoProdct}
    />

      {/* SECCIÓN: LISTADO Y EDICIÓN */}
      <section>
        <h2 className="text-gray-500 text-[10px] tracking-[0.3em] uppercase mb-10">Stock Actual ({productos.length})</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          <AnimatePresence>
            {productos.map((item) => (
              <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 bg-[#0a0a0a] p-4 border border-white/5">
                <Card producto={item} isLogIn={isLogIn} />
                
                <div className="flex gap-2">
                  <button onClick={() => abrirPanelEdicion(item.id)} className={btnSecondary}>Editar Datos</button>
                  <button onClick={() => borrarProducto(item.id)} className={btnDanger}>Eliminar</button>
                </div>

                <EditarProductoAdmin
                actualizarDatos={actualizarDatos}
                setActualizarDatos={setActualizarDatos}
                imagenesEditor={imagenesEditor}
                setFotosSeleccionadas={setFotosSeleccionadas}
                actualizarProducto={actualizarProducto}
                marcarPrincipal={marcarPrincipal}
                inputClass={inputClass}
                idProductoEditado={idProductoEditado}
                item={item}
                setIdProductoEditado={setIdProductoEditado}
                borrarUnaFoto={borrarUnaFoto}/>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;