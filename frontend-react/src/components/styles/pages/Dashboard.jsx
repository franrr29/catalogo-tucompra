import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, number } from "framer-motion";
import Card from "../../ProductCard";

function Dashboard({isLogIn}) {
  const [control, setControl] = useState({ nombre: "", precio: "", stock: "", imagen: "" });
  const [productos, setProductos] = useState([]);
  const [patchDatos, setPatchDatos] = useState({ nombre: "", precio: "", stock: "", imagen: "" });
  const [idPatch, setIdPatch] = useState(null);
  const [uploadFiles, setUploadFiles]= useState (null);
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

  async function uploadPhotos(productoId){
    const formData= new FormData ()
    Array.from(uploadFiles).forEach(file => { //aca convertimos en un array de JS con array.from para que el Foreach pueda iterar
    formData.append("imagenes", file)
})
    try {
      const res= await fetch (`http://localhost:4000/api/imagenes/${productoId}`, {
        method: "POST",
        body: formData
      });

      const data= await res.json()
      console.log (data)
      
    } catch (error){
      console.error ("Error al cargar las fotos", error)
    }
  }

  //Funcion para fetch de imagenes y agregarla como favorito en card//
  async function abrirEditor(id) {
    try {
      setIdPatch (id)
      const res= await fetch (`http://localhost:4000/api/productos/${id}`)
      const data= await res.json ();
      setImagenesEditor (data.imagenes)
    } catch (error){
      console.error ("Error al cargar las imagenes del editor", error)
    }
  }

  useEffect(() => {
    // Detectar actividad para resetear el timer
    const eventos = ["click", "keydown", "mousemove"];
    eventos.forEach(e => window.addEventListener(e, resetearTimer));
    resetearTimer();

    // Verificación de Token
    const token = localStorage.getItem("token");
    if (!token) return navigate("/admin/login");

    async function getProductos() {
      try {
        const resp = await fetch("http://localhost:4000/api/productos");
        const data = await resp.json();
        setProductos(data);
      } catch (error) {
        console.error("Error al traer productos");
      }
    }
    getProductos();

    return () => {
      eventos.forEach(e => window.removeEventListener(e, resetearTimer));
      clearTimeout(timerRef.current);
    };
  }, []);

  //===LOGICA CRUD DEL ADMIN===//

  //===CREAR PRODUCTO NUEVO COMO ADMIN===//

  async function newProduct() {
    if (!control.nombre || !control.precio || !control.stock) {
      alert("Debes completar nombre, precio y stock");
      return;
    }

    try {
      const datosProducto = {
        nombre: control.nombre.trim(),
        precio: Number(control.precio),
        stock: Number(control.stock),
        imagen: control.imagen.trim() || null
      };

      const resp = await fetch("http://localhost:4000/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosProducto)
      });

      const data = await resp.json();
      console.log(data);

      if (resp.ok) {
        setProductos([...productos, { ...datosProducto, id: data.id }]); 
        setControl({ nombre: "", precio: "", stock: "", imagen: "" });
      }

    } catch (error) {
      console.error("Error al crear el producto");
    }
  }

  //===BORRAR PRODUCTO COMO ADMIN===//

  async function deleteProdct(id) {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      const resp = await fetch(`http://localhost:4000/api/productos/${id}`, { method: "DELETE" });
      if (resp.ok) setProductos(productos.filter(item => item.id !== id));
    } catch (error) { console.error("Error al borrar"); }
  }

  //===EDITAR PRODUCTO COMO ADMIN===//

  async function patchProduct(id) {
    try {
      const soloRellenos = Object.fromEntries(
        Object.entries(patchDatos).filter(([_, valor]) => valor !== "")
      );
      const resp = await fetch(`http://localhost:4000/api/productos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(soloRellenos)
      });
      if (resp.ok) {
        setProductos(productos.map(p => p.id === id ? { ...p, ...soloRellenos } : p));
        setIdPatch(null);
        setPatchDatos({ nombre: "", precio: "", stock: "", imagen: "" });

        if (uploadFiles !==null){
          await uploadPhotos (id)
        }
      }

    } catch (error) { console.error("Error al actualizar"); }
  }

  // --- ESTILOS REUTILIZABLES ---
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

      {/* SECCIÓN: CREAR PRODUCTO */}
      <section className="bg-[#0a0a0a] border border-white/5 p-8 mb-20">
        <h2 className="text-amber-500 text-[10px] tracking-[0.3em] uppercase mb-8 font-bold">Registrar Nuevo Producto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <input type="text" placeholder="NOMBRE DEL MODELO" value={control.nombre} onChange={(e) => setControl({ ...control, nombre: e.target.value })} className={inputClass} />
          <input type="number" placeholder="PRECIO UNITARIO" value={control.precio} onChange={(e) => setControl({ ...control, precio: e.target.value })} className={inputClass} />
          <input type="number" placeholder="STOCK DISPONIBLE" value={control.stock} onChange={(e) => setControl({ ...control, stock: e.target.value })} className={inputClass} />
          <input type="text" placeholder="URL DE IMAGEN" value={control.imagen} onChange={(e) => setControl({ ...control, imagen: e.target.value })} className={inputClass} />
        </div>
        <button onClick={newProduct} className={btnPrimary}>Cargar a Base de Datos</button>
      </section>

      {/* SECCIÓN: LISTADO Y EDICIÓN */}
      <section>
        <h2 className="text-gray-500 text-[10px] tracking-[0.3em] uppercase mb-10">Stock Actual ({productos.length})</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          <AnimatePresence>
            {productos.map((item) => (
              <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 bg-[#0a0a0a] p-4 border border-white/5">
                <Card producto={item} isLogIn={isLogIn} />
                
                <div className="flex gap-2">
                  <button onClick={() => abrirEditor(item.id)} className={btnSecondary}>Editar Datos</button>
                  <button onClick={() => deleteProdct(item.id)} className={btnDanger}>Eliminar</button>
                </div>

                {/* MODAL DE EDICIÓN RÁPIDA */}
                <AnimatePresence>
                  {idPatch === item.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/10 pt-4 mt-2 flex flex-col gap-3">
                      <input type="text" placeholder="Nuevo Nombre" value={patchDatos.nombre} onChange={(e) => setPatchDatos({...patchDatos, nombre: e.target.value})} className={inputClass}/>
                      <input type="number" placeholder="Nuevo Precio" value={patchDatos.precio} onChange={(e) => setPatchDatos({...patchDatos, precio: e.target.value})} className={inputClass}/>
                      <input type="number" placeholder="Nuevo Stock" value={patchDatos.stock} onChange={(e) => setPatchDatos({...patchDatos, stock: e.target.value})} className={inputClass}/>
                      
                      {/* ÁREA DE CARGA DE ARCHIVOS PERSONALIZADA */}
                      <div className="flex flex-col gap-2 bg-white/5 p-3 border border-white/5">
                        <p className="text-[9px] text-amber-500/70 tracking-widest uppercase mb-1">Actualizar Multimedia</p>
                        <input 
                          type="file" 
                          multiple
                          onChange={(e)=> setUploadFiles(e.target.files)}
                          className="text-[9px] text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-white/10 file:text-white file:text-[9px] file:uppercase file:tracking-widest hover:file:bg-white/20 cursor-pointer transition-all"
                        />
                    
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button onClick={() => patchProduct(item.id)} className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">Guardar</button>
                        <button onClick={() => setIdPatch(null)} className="text-[10px] text-gray-500 uppercase tracking-widest">Cancelar</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

    </div>
  );
}

export default Dashboard;