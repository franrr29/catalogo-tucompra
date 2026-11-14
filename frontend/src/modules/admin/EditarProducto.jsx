import { motion, AnimatePresence } from "framer-motion";
import { boton, etiqueta } from "./ui/estilos";
import { costoMayorQuePrecio } from "./costos";

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
            className="overflow-hidden border-t border-linea pt-6 mt-2 flex flex-col gap-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-2">
                <label className={etiqueta}>Producto</label>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={actualizarDatos.nombre}
                  onChange={(e) => setActualizarDatos({ ...actualizarDatos, nombre: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={etiqueta}>Precio</label>
                <input
                  type="number"
                  placeholder="Precio"
                  value={actualizarDatos.precio}
                  onChange={(e) => setActualizarDatos({ ...actualizarDatos, precio: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="costo-edicion" className={etiqueta}>Costo</label>
                <input
                  id="costo-edicion"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Sin costo cargado"
                  value={actualizarDatos.costo ?? ""}
                  onChange={(e) => setActualizarDatos({ ...actualizarDatos, costo: e.target.value })}
                  aria-describedby="ayuda-costo-edicion"
                  className={inputClass}
                />
                <div id="ayuda-costo-edicion" className="flex flex-col gap-1">
                  <p className="text-xs text-muted">Vacío = costo desconocido (sin margen).</p>
                  {costoMayorQuePrecio(actualizarDatos.costo, actualizarDatos.precio) && (
                    <p role="status" className="text-xs font-semibold text-amber-800">
                      El costo es mayor que el precio: esta venta daría pérdida.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className={etiqueta}>Stock</label>
                <input
                  type="number"
                  placeholder="Stock"
                  value={actualizarDatos.stock}
                  onChange={(e) => setActualizarDatos({ ...actualizarDatos, stock: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className={etiqueta}>
                Descripcion (opcional, vacio = texto general)
              </label>
              <textarea
                rows={4}
                maxLength={2000}
                placeholder="Si lo dejas vacio se muestra el texto general de los relojes"
                value={actualizarDatos.descripcion || ""}
                onChange={(e) => setActualizarDatos({ ...actualizarDatos, descripcion: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-4 border border-linea rounded-tarjeta p-5 sm:p-6 bg-paper/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink">
                  Fotos del producto
                </span>
                <label className="relative overflow-hidden cursor-pointer rounded-control border border-campo bg-superficie px-4 py-2.5 transition-colors duration-150 motion-reduce:transition-none hover:border-ink focus-within:ring-2 focus-within:ring-oro-acento text-center">
                  <span className="text-sm font-semibold text-ink">Subir archivos</span>
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
                    className="flex items-center justify-between gap-3 border border-linea rounded-control p-3 bg-superficie group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative overflow-hidden w-12 h-12 border border-linea rounded-lg flex-shrink-0 bg-paper">
                        <img
                          src={imagen.url}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          alt="Preview"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                          {imagen.orden === 0 ? "Portada Actual" : "Imagen Cargada"}
                        </span>
                        <span className="text-sm text-ink truncate max-w-[160px] sm:max-w-xs">ID: {imagen.id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                      <button
                        onClick={() => marcarPrincipal(imagen.id, item.id)}
                        className={`text-xs font-semibold uppercase tracking-[0.06em] whitespace-nowrap py-1 rounded transition-colors duration-150 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-oro-acento ${
                          imagen.orden === 0 ? "text-ink cursor-default" : "text-oro-texto hover:text-ink underline underline-offset-2"
                        }`}
                        disabled={imagen.orden === 0}
                      >
                        {imagen.orden === 0 ? "Principal" : "Hacer Principal"}
                      </button>
                      <button
                        onClick={() => borrarUnaFoto(imagen.id)}
                        className="text-xs font-semibold uppercase tracking-[0.06em] text-red-700 hover:text-red-800 underline underline-offset-2 rounded transition-colors duration-150 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 whitespace-nowrap py-1"
                      >
                        Quitar
                      </button>
                    </div>
                  </motion.div>
                ))}

                {previewsPendientes.map((url, i) => (
                  <motion.div
                    key={`pending-${i}`}
                    className="flex items-center justify-between gap-3 border border-oro-acento rounded-control p-3 bg-oro-suave/50 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative overflow-hidden w-12 h-12 border border-oro-acento rounded-lg flex-shrink-0 bg-paper">
                        <img
                          src={url}
                          className="w-full h-full object-cover"
                          alt="Nuevo"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold uppercase tracking-[0.06em] text-oro-texto">Nuevo Archivo</span>
                        <span className="text-sm text-ink truncate">Pendiente de guardar</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:gap-4 pt-5 border-t border-linea">
              <button
                onClick={() => setIdProductoEditado(null)}
                className={boton.secundario}
              >
                Descartar
              </button>
              <button
                onClick={() => actualizarProducto(item.id)}
                className={boton.primario}
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