import { motion, AnimatePresence } from "framer-motion";

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
  borrarUnaFoto,
  previewsPendientes
}) {
  return (
    <>
      <AnimatePresence>
        {idProductoEditado === item.id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden border-t border-border pt-6 mt-4 flex flex-col gap-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-sans text-muted-light uppercase tracking-wider">Producto</label>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={actualizarDatos.nombre}
                  onChange={(e) => setActualizarDatos({ ...actualizarDatos, nombre: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-sans text-muted-light uppercase tracking-wider">Precio</label>
                <input
                  type="number"
                  placeholder="Precio"
                  value={actualizarDatos.precio}
                  onChange={(e) => setActualizarDatos({ ...actualizarDatos, precio: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-sans text-muted-light uppercase tracking-wider">Stock</label>
                <input
                  type="number"
                  placeholder="Stock"
                  value={actualizarDatos.stock}
                  onChange={(e) => setActualizarDatos({ ...actualizarDatos, stock: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 border border-border rounded p-5 sm:p-6 bg-white/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-sans text-ink uppercase tracking-wider font-semibold">
                  Fotos del Producto
                </span>
                <label className="relative overflow-hidden cursor-pointer border border-border hover:border-[#111111] bg-white px-4 py-3 sm:py-2 transition-colors text-center rounded">
                  <span className="text-xs font-sans text-ink uppercase tracking-wider">Subir Archivos</span>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFotosSeleccionadas(e.target.files)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-2.5 mt-1">
                {imagenesEditor.map((imagen) => (
                  <motion.div
                    key={imagen.id}
                    className="flex items-center justify-between gap-3 border border-border rounded p-3 bg-white group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative overflow-hidden w-12 h-12 border border-border rounded flex-shrink-0 bg-[#E2E2DF]">
                        <img
                          src={imagen.url}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          alt="Preview"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-sans text-muted-light uppercase tracking-wider">
                          {imagen.orden === 0 ? "Portada Actual" : "Imagen Cargada"}
                        </span>
                        <span className="text-xs font-sans text-ink truncate max-w-[160px] sm:max-w-xs">ID: {imagen.id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                      <button
                        onClick={() => marcarPrincipal(imagen.id, item.id)}
                        className={`text-xs font-sans uppercase tracking-wider transition-colors whitespace-nowrap font-medium py-1 ${
                          imagen.orden === 0 ? "text-ink font-bold cursor-default" : "text-brand hover:text-[#A3740A]"
                        }`}
                        disabled={imagen.orden === 0}
                      >
                        {imagen.orden === 0 ? "Principal" : "Hacer Principal"}
                      </button>
                      <button
                        onClick={() => borrarUnaFoto(imagen.id)}
                        className="text-xs font-sans uppercase tracking-wider text-red-600 hover:text-red-700 transition-colors whitespace-nowrap font-medium py-1"
                      >
                        Quitar
                      </button>
                    </div>
                  </motion.div>
                ))}

                {previewsPendientes.map((url, i) => (
                  <motion.div
                    key={`pending-${i}`}
                    className="flex items-center justify-between gap-3 border border-brand rounded p-3 bg-white group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative overflow-hidden w-12 h-12 border border-brand rounded flex-shrink-0 bg-[#E2E2DF]">
                        <img
                          src={url}
                          className="w-full h-full object-cover"
                          alt="Nuevo"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-sans text-brand uppercase tracking-wider">Nuevo Archivo</span>
                        <span className="text-xs font-sans text-ink truncate">Pendiente de guardar</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:gap-6 pt-4 border-t border-border">
              <button
                onClick={() => setIdProductoEditado(null)}
                className="text-xs font-sans text-muted uppercase tracking-wider hover:text-ink transition-colors py-3 sm:py-0 text-center"
              >
                Descartar
              </button>
              <button
                onClick={() => actualizarProducto(item.id)}
                className="text-xs text-white bg-brand hover:bg-[#A3740A] px-6 py-3.5 transition-colors uppercase tracking-widest font-sans font-medium text-center rounded"
              >
                Confirmar Cambios
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default EditarProductoAdmin;