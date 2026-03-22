import { motion, AnimatePresence } from "framer-motion";

//===EDITAR UN PRODUCTO Y ABRIR EL MODAL DE EDICION COMO ADMIN EN DASHBOARD===//

function EditarProductoAdmin ({
  actualizarDatos,
  setActualizarDatos,
  imagenesEditor,
  setFotosSeleccionadas,
  actualizarProducto,
  marcarPrincipal,
  inputClass,
  idProductoEditado,
  item,
  setIdProductoEditado,
  borrarUnaFoto
}) {
  return (
    <>
      {/* MODAL DE EDICION RAPIDA */}
      <AnimatePresence>
        {idProductoEditado === item.id && (
          <motion.div
            initial={{ height: 0, opacity: 0, scale: 0.95 }}
            animate={{ height: "auto", opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden border-t border-white/5 pt-6 mt-4 flex flex-col gap-4"
          >
            {/* Contenedor de inputs con grid para mejor organizacion visual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 uppercase tracking-tighter ml-1">Producto</span>
                <input
                  type="text"
                  placeholder="Nuevo Nombre"
                  value={actualizarDatos.nombre}
                  onChange={(e) =>
                    setActualizarDatos({ ...actualizarDatos, nombre: e.target.value })
                  }
                  className={`${inputClass} bg-white/5 border-white/10 focus:border-amber-500/50 transition-all`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 uppercase tracking-tighter ml-1">Precio</span>
                <input
                  type="number"
                  placeholder="Nuevo Precio"
                  value={actualizarDatos.precio}
                  onChange={(e) =>
                    setActualizarDatos({ ...actualizarDatos, precio: e.target.value })
                  }
                  className={`${inputClass} bg-white/5 border-white/10 focus:border-amber-500/50 transition-all`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 uppercase tracking-tighter ml-1">Stock disponible</span>
                <input
                  type="number"
                  placeholder="Nuevo Stock"
                  value={actualizarDatos.stock}
                  onChange={(e) =>
                    setActualizarDatos({ ...actualizarDatos, stock: e.target.value })
                  }
                  className={`${inputClass} bg-white/5 border-white/10 focus:border-amber-500/50 transition-all`}
                />
              </div>
            </div>

            {/* AREA DE CARGA DE ARCHIVOS CON ESTILO GLASSMORPHISM */}
            <div className="flex flex-col gap-3 bg-gradient-to-b from-white/[0.03] to-transparent p-4 rounded-lg border border-white/5">
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-amber-500 font-medium tracking-widest uppercase">
                  Fotos del producto
                </p>
               <label className="relative overflow-hidden cursor-pointer bg-amber-500/10 hover:bg-white/20 px-3 py-1 transition-all border border-white/10">
  <span className="text-[9px] text-white uppercase tracking-widest">Subir Archivos</span>
  <input
    type="file"
    multiple
    onChange={(e) => setFotosSeleccionadas(e.target.files)}
    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
  />
</label>
              </div>

              {/* Grid de imagenes */}
             <div className="grid grid-cols-1 gap-2 mt-2">
              {imagenesEditor.map((imagen) => (
                <motion.div 
                  layout
                  key={imagen.id} 
                  className="flex flex-wrap items-center justify-between gap-3 bg-black/40 backdrop-blur-md p-3 rounded-md border border-white/10 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative overflow-hidden rounded-sm w-12 h-12 border border-white/10 flex-shrink-0">
                      <img
                        src={imagen.url}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                        alt="Producto"
                      />
                    </div>
                    <div className="flex flex-col min-w-[80px]">
                       <span className="text-[7px] text-gray-500 uppercase tracking-widest">Estado</span>
                       <span className="text-[9px] text-white/70 whitespace-nowrap">Imagen cargada</span>
                    </div>
                  </div>
                  
                  {/* Ajuste clave: flex-grow para ocupar el ancho y justify-end */}
                  <div className="flex flex-1 justify-end items-center gap-4 min-w-fit">
                    <button 
                      onClick={() => marcarPrincipal(imagen.id, item.id)}
                      className="text-[9px] uppercase tracking-widest text-amber-500/60 hover:text-amber-500 transition-colors whitespace-nowrap"
                    >
                      Principal
                    </button>
                    
                    <button 
                      onClick={() => borrarUnaFoto(imagen.id)}
                      className="text-[9px] uppercase tracking-widest text-gray-600 hover:text-red-500 transition-colors whitespace-nowrap"
                    >
                      Quitar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            </div>

            {/* BOTONES DE ACCION FINAL */}
            <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
              <button
                onClick={() => setIdProductoEditado(null)}
                className="text-[11px] text-gray-500 uppercase tracking-[0.2em] hover:text-white transition-all"
              >
                Descartar
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => actualizarProducto(item.id)}
                className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2 rounded-sm text-[11px] uppercase tracking-[0.2em] font-bold shadow-lg shadow-amber-500/10 transition-all"
              >
                Confirmar Cambios
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default EditarProductoAdmin;