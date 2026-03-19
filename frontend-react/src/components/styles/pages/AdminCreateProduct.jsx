

function CrearNuevoProdct ({nuevoProducto, setNuevoProducto, setFotosSeleccionadas, crearNuevoProducto}){

     // --- ESTILOS REUTILIZABLES ---
  const inputClass = "bg-white/5 border border-white/10 text-white text-xs px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-all placeholder-gray-700 w-full";
  const btnPrimary = "bg-white text-black text-[10px] font-bold tracking-widest uppercase px-6 py-3 hover:bg-amber-500 transition-all";

    return (
        <div className="bg-black text-white px-8 py-24">
        
              {/* SECCIÓN: CREAR PRODUCTO */}
              <section className="bg-[#0a0a0a] border border-white/5 p-8 mb-20">
                <h2 className="text-amber-500 text-[10px] tracking-[0.3em] uppercase mb-8 font-bold">Registrar Nuevo Producto</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <input type="text" placeholder="NOMBRE DEL MODELO" value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })} className={inputClass} />
                  <input type="number" placeholder="PRECIO UNITARIO" value={nuevoProducto.precio} onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })} className={inputClass} />
                  <input type="number" placeholder="STOCK DISPONIBLE" value={nuevoProducto.stock} onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: e.target.value })} className={inputClass} />
                  <input type="file"
                    multiple
                    onChange={(e)=>{setFotosSeleccionadas (e.target.files)}} className="text-[9px] text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-amber-500 file:text-black file:text-[9px] file:uppercase file:tracking-widest hover:file:bg-amber-600 cursor-pointer transition-all underline-none"
         />
                  </div>
                <button onClick={crearNuevoProducto} className={btnPrimary}>Cargar a Base de Datos</button>
              </section>
              </div>
    )
};

export default CrearNuevoProdct;