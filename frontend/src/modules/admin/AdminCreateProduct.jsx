import { motion } from "framer-motion";

function CrearNuevoProdct({ nuevoProducto, setNuevoProducto, setFotosSeleccionadas, crearNuevoProducto, creando }) {

  const inputClass = "bg-transparent border border-border text-ink text-xs px-4 py-3.5 focus:outline-none focus:border-[#111111] transition-all placeholder-[#999999] w-full font-sans rounded";

  return (
    <div className="w-full">
      <motion.div 
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-transparent flex flex-col gap-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-sans text-muted-light uppercase tracking-wider">Modelo</label>
            <input 
              type="text" 
              placeholder="Ej: G-Shock Gold" 
              value={nuevoProducto.nombre} 
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-sans text-muted-light uppercase tracking-wider">Precio</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={nuevoProducto.precio} 
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-sans text-muted-light uppercase tracking-wider">Stock</label>
            <input 
              type="number" 
              placeholder="Unidades" 
              value={nuevoProducto.stock} 
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: e.target.value })} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-sans text-muted-light uppercase tracking-wider">Multimedia</label>
            <label className="relative cursor-pointer group block">
              <div className="border border-border group-hover:border-[#111111] py-3.5 px-4 text-center transition-colors rounded">
                <span className="text-xs font-sans text-muted group-hover:text-ink uppercase tracking-wider">
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

        <div className="flex flex-col gap-2">
          <label className="text-xs font-sans text-muted-light uppercase tracking-wider">
            Descripcion (opcional)
          </label>
          <textarea
            rows={4}
            maxLength={2000}
            placeholder="Si lo dejas vacio se muestra el texto general de los relojes"
            value={nuevoProducto.descripcion || ""}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, descripcion: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="flex justify-start pt-2">
          <button
            onClick={crearNuevoProducto}
            disabled={creando}
            className={`text-xs text-white bg-brand hover:bg-[#A3740A] px-8 py-4 transition-colors uppercase tracking-widest font-sans font-medium rounded ${creando ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {creando ? "Publicando..." : "Publicar artículo"}
          </button>
        </div>
        
      </motion.div>
    </div>
  );
}

export default CrearNuevoProdct;