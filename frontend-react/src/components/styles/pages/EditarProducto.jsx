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
})

{
  return (
    <>
      {/* MODAL DE EDICIÓN RÁPIDA */}
      <AnimatePresence>
        {idProductoEditado === item.id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 pt-4 mt-2 flex flex-col gap-3"
          >
            <input
              type="text"
              placeholder="Nuevo Nombre"
              value={actualizarDatos.nombre}
              onChange={(e) =>
                setActualizarDatos({ ...actualizarDatos, nombre: e.target.value })
              }
              className={inputClass}
            />

            <input
              type="number"
              placeholder="Nuevo Precio"
              value={actualizarDatos.precio}
              onChange={(e) =>
                setActualizarDatos({ ...actualizarDatos, precio: e.target.value })
              }
              className={inputClass}
            />

            <input
              type="number"
              placeholder="Nuevo Stock"
              value={actualizarDatos.stock}
              onChange={(e) =>
                setActualizarDatos({ ...actualizarDatos, stock: e.target.value })
              }
              className={inputClass}
            />

            {/* ÁREA DE CARGA DE ARCHIVOS PERSONALIZADA */}
            <div className="flex flex-col gap-2 bg-white/5 p-3 border border-white/5">
              <p className="text-[9px] text-amber-500/70 tracking-widest uppercase mb-1">
                Actualizar Multimedia
              </p>

              <input
                type="file"
                multiple
                onChange={(e) => setFotosSeleccionadas(e.target.files)}
                className="text-[9px] text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-white/10 file:text-white file:text-[9px] file:uppercase file:tracking-widest hover:file:bg-white/20 cursor-pointer transition-all"
              />

              {imagenesEditor.map((imagen) => (
                <div key={imagen.id} className="flex items-center gap-2">
                  <img
                    src={imagen.url}
                    className="w-16 h-16 object-contain"
                    alt="imagenProducto"
                  />
                  <button onClick={() => marcarPrincipal(imagen.id, item.id)}>
                    Agregar como portada
                  </button>
                  <button onClick={()=>borrarUnaFoto(imagen.id)}>Eliminar foto</button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => actualizarProducto(item.id)}
                className="text-[10px] text-amber-500 uppercase tracking-widest font-bold"
              >
                Guardar
              </button>

              <button
                onClick={() => setIdProductoEditado(null)}
                className="text-[10px] text-gray-500 uppercase tracking-widest"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default EditarProductoAdmin;