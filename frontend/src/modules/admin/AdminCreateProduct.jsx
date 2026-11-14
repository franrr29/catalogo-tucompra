import { motion } from "framer-motion";
import { boton, campo, etiqueta } from "./ui/estilos";
import { costoMayorQuePrecio } from "./costos";

function CrearNuevoProdct({ nuevoProducto, setNuevoProducto, setFotosSeleccionadas, crearNuevoProducto, creando }) {

  const inputClass = campo;

  return (
    <div className="w-full">
      <motion.div 
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="flex flex-col gap-2">
            <label className={etiqueta}>Modelo</label>
            <input 
              type="text" 
              placeholder="Ej: G-Shock Gold" 
              value={nuevoProducto.nombre} 
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={etiqueta}>Precio</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={nuevoProducto.precio} 
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="costo-nuevo" className={etiqueta}>Costo (opcional)</label>
            <input
              id="costo-nuevo"
              type="number"
              min="0"
              step="0.01"
              placeholder="Lo que te cuesta"
              value={nuevoProducto.costo ?? ""}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, costo: e.target.value })}
              aria-describedby="ayuda-costo-nuevo"
              className={inputClass}
            />
            <div id="ayuda-costo-nuevo" className="flex flex-col gap-1">
              <p className="text-xs text-muted">Sin costo, no se calcula el margen.</p>
              {costoMayorQuePrecio(nuevoProducto.costo, nuevoProducto.precio) && (
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
              placeholder="Unidades" 
              value={nuevoProducto.stock} 
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: e.target.value })} 
              className={inputClass} 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={etiqueta}>Multimedia</label>
            <label className="relative cursor-pointer group block">
              <div className="rounded-control border border-dashed border-campo bg-superficie py-3 px-4 text-center transition-colors duration-150 motion-reduce:transition-none group-hover:border-ink group-focus-within:ring-2 group-focus-within:ring-oro-acento">
                <span className="text-sm font-semibold text-ink">
                  Seleccionar fotos
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
          <label className={etiqueta}>
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
            className={`${boton.primario} px-8`}
          >
            {creando ? "Publicando..." : "Publicar artículo"}
          </button>
        </div>
        
      </motion.div>
    </div>
  );
}

export default CrearNuevoProdct;