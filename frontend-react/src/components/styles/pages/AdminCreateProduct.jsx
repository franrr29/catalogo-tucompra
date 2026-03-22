import { motion } from "framer-motion";

function CrearNuevoProdct({ nuevoProducto, setNuevoProducto, setFotosSeleccionadas, crearNuevoProducto }) {

  //ESTILOS REUTILIZABLES ACTUALIZADOS
  const inputClass = "bg-white/[0.03] border border-white/10 text-white text-[11px] px-4 py-3 focus:outline-none focus:border-amber-500/40 transition-all placeholder-gray-600 w-full rounded-sm tracking-widest uppercase";
  
const btnPrimary = "bg-amber-500 text-black text-[10px] font-bold tracking-[0.2em] uppercase px-8 py-4 hover:bg-amber-400 transition-all duration-300 rounded-sm";
  return (
    <div className="bg-black text-white px-4 md:px-8 py-12">
      
      {/* SECCION: CREAR PRODUCTO CON ANIMACION AL ENTRAR */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a0a0a] border border-white/5 p-8 mb-20 shadow-2xl relative overflow-hidden"
      >
        {/* decoracion de fondo sutil */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[80px] pointer-events-none" />

        <h2 className="text-amber-500 text-[10px] tracking-[0.4em] uppercase mb-10 font-bold flex items-center gap-2">
          <span className="w-8 h-[1px] bg-amber-500/30"></span>
          Registrar Nuevo Producto
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          <div className="flex flex-col gap-2">
            <span className="text-[9px] text-gray-500 tracking-widest uppercase ml-1">Modelo</span>
            <input 
              type="text" 
              placeholder="Ej: G-Shock Gold" 
              value={nuevoProducto.nombre} 
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[9px] text-gray-500 tracking-widest uppercase ml-1">Precio</span>
            <input 
              type="number" 
              placeholder="0.00" 
              value={nuevoProducto.precio} 
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[9px] text-gray-500 tracking-widest uppercase ml-1">Stock</span>
            <input 
              type="number" 
              placeholder="Unidades" 
              value={nuevoProducto.stock} 
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: e.target.value })} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[9px] text-gray-500 tracking-widest uppercase ml-1">Multimedia</span>
            <label className="relative cursor-pointer group">

              {/* input de archivos oculto con diseño personalizado */}
              <div className="bg-white/5 border border-dashed border-white/20 group-hover:border-amber-500/50 py-3 px-4 text-center transition-all">
                <span className="text-[9px] text-gray-400 group-hover:text-amber-500 tracking-widest uppercase">
                  Seleccionar Fotos
                </span>
              </div>
              <input 
                type="file"
                multiple
                onChange={(e) => { setFotosSeleccionadas(e.target.files) }} 
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
          </div>

        </div>

        <div className="flex justify-start">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={crearNuevoProducto} 
            className={btnPrimary}
          >
            Publicar
          </motion.button>
        </div>
        
      </motion.section>
    </div>
  );
};

export default CrearNuevoProdct;