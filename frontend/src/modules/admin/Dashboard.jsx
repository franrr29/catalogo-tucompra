import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import CrearNuevoProdct from "./AdminCreateProduct";
import EditarProductoAdmin from "./EditarProducto";
import ProductSelector from "./ProductSelector";
import { useAdminSession } from "./hooks/useAdminSession";
import { useProductosAdmin } from "./hooks/useProductosAdmin";
import { useEdicionProducto } from "./hooks/useEdicionProducto";
import { useFotosPendientes } from "./hooks/useFotosPendientes";
import * as adminService from "./admin.service";

const FORM_NUEVO_PRODUCTO = { nombre: "", precio: "", stock: "", imagen: "" };

const toastStyle = {
  style: {
    background: '#F4F4F2',
    color: '#111111',
    border: '1px solid #CCCCCC',
    borderRadius: '0px',
    fontSize: '11px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    padding: '16px',
    fontFamily: 'sans-serif'
  },
  iconTheme: {
    primary: '#C89211',
    secondary: '#F4F4F2',
  },
};

function Dashboard() {
  const navigate = useNavigate();

  // sesion del admin: token y cierre por inactividad
  const { cerrarSesion } = useAdminSession(navigate);

  // lista de productos y sus acciones de alta, baja y modificacion
  const { productos, crearProducto, actualizarProducto, borrarProducto } = useProductosAdmin(cerrarSesion);

  // producto que se esta editando en el panel de abajo
  const edicion = useEdicionProducto(cerrarSesion);

  // fotos elegidas y sus previsualizaciones, para crear o editar
  const fotos = useFotosPendientes(edicion.idProductoEditado);

  const [nuevoProducto, setNuevoProducto] = useState(FORM_NUEVO_PRODUCTO);
  const [creando, setCreando] = useState(false);

  const inputClass = "bg-transparent border border-[#CCCCCC] text-[#111111] text-xs px-4 py-3.5 focus:outline-none focus:border-[#111111] transition-all placeholder-[#999999] w-full font-sans rounded";

  // sube las fotos pendientes para un producto puntual, si es que hay
  async function subirFotosPendientes(productoId) {
    if (!fotos.fotosSeleccionadas) return;

    const formData = new FormData();
    Array.from(fotos.fotosSeleccionadas).forEach((archivo) => formData.append("imagenes", archivo));

    try {
      await adminService.subirImagenes(productoId, formData);
    } catch (error) {
      toast.error("error al subir las imagenes", toastStyle);
    }

    fotos.limpiar();
  }

  async function manejarCrearProducto() {
    if (creando) return;
    if (!nuevoProducto.nombre || !nuevoProducto.precio || !nuevoProducto.stock) {
      toast.error("debes completar nombre, precio y stock", toastStyle);
      return;
    }

    setCreando(true);
    try {
      const producto = await crearProducto({
        nombre: nuevoProducto.nombre.trim(),
        precio: Number(nuevoProducto.precio),
        stock: Number(nuevoProducto.stock),
      });

      if (producto) {
        setNuevoProducto(FORM_NUEVO_PRODUCTO);
        await subirFotosPendientes(producto.id);
        toast.success("producto creado", toastStyle);
      }
    } catch (error) {
      const mensaje = error.response?.data?.error || error.response?.data?.mensaje || "error al crear el producto";
      toast.error(mensaje, toastStyle);
    } finally {
      setCreando(false);
    }
  }

  async function manejarSeleccionarProducto(id) {
    fotos.setFotosSeleccionadas(null);
    await edicion.abrirPanel(id, productos);
  }

  async function manejarActualizarProducto(id) {
    try {
      const soloRellenos = Object.fromEntries(
        Object.entries(edicion.actualizarDatos).filter(([, valor]) => valor !== "")
      );
      await actualizarProducto(id, soloRellenos);
      await subirFotosPendientes(id);
      await edicion.abrirPanel(id, productos);
      toast.success("producto actualizado", toastStyle);
    } catch (error) {
      toast.error("error al actualizar", toastStyle);
    }
  }

  async function manejarBorrarProducto(id) {
    if (!window.confirm("estas seguro de eliminar este producto?")) return;
    try {
      await borrarProducto(id);
      if (edicion.idProductoEditado === id) {
        edicion.cerrarPanel();
      }
      toast.success("producto eliminado", toastStyle);
    } catch (error) {
      toast.error("error al eliminar", toastStyle);
    }
  }

  async function manejarMarcarPrincipal(imagenId) {
    await edicion.marcarPrincipal(imagenId, edicion.idProductoEditado, productos);
    toast.success("portada establecida", toastStyle);
  }

  async function manejarBorrarFoto(imagenId) {
    try {
      await edicion.borrarFoto(imagenId);
      toast.success("imagen eliminada", toastStyle);
    } catch (error) {
      toast.error("error al eliminar foto", toastStyle);
    }
  }

  const productoActualObj = productos.find((p) => p.id === Number(edicion.idProductoEditado));

  return (
    <div className="min-h-screen bg-[#F4F4F2] text-[#111111] font-sans antialiased px-4 sm:px-12 lg:px-16 pt-28 sm:pt-32 pb-24 selection:bg-[#E2E2DF]">
      <div className="max-w-3xl mx-auto flex flex-col gap-10">

        {/* encabezado del dashboard */}
        <header className="border-b border-[#CCCCCC] pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 font-sans">
              <span className="w-1.5 h-1.5 bg-[#C89211]" />
              <span className="text-[10px] text-[#666666] uppercase tracking-widest">Panel de Gestión</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-light tracking-tight text-[#111111]">
              CONTROL DE <span className="font-semibold text-[#C89211]">INVENTARIO</span>
            </h1>
          </div>
          <div className="font-sans text-[11px] text-[#666666] uppercase self-start sm:self-auto bg-[#E2E2DF]/50 px-3 py-1.5 border border-[#CCCCCC] rounded">
            Activos: <span className="text-[#111111] font-semibold">{productos.length}</span>
          </div>
        </header>

        {/* seccion para crear un producto nuevo */}
        <section className="border border-[#CCCCCC] rounded p-6 sm:p-8 bg-white/40 backdrop-blur-sm relative shadow-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-2 bg-[#C89211]" />
          <div className="flex items-center gap-2 mb-6 font-sans">
            <span className="w-1.5 h-1.5 bg-[#C89211]" />
            <h2 className="text-xs uppercase tracking-widest text-[#111111] font-semibold">
              01 / Nuevo Artículo
            </h2>
          </div>
          <CrearNuevoProdct
            nuevoProducto={nuevoProducto}
            setNuevoProducto={setNuevoProducto}
            setFotosSeleccionadas={fotos.setFotosSeleccionadas}
            crearNuevoProducto={manejarCrearProducto}
            creando={creando}
          />
        </section>

        {/* seccion para modificar o eliminar un producto */}
        <section className="border border-[#CCCCCC] rounded p-6 sm:p-8 bg-white/40 backdrop-blur-sm flex flex-col gap-6 relative shadow-sm">
          <div className="absolute top-0 right-0 w-2 h-2 bg-[#C89211] rounded-tr" />
          <div className="flex items-center gap-2 font-sans">
            <span className="w-1.5 h-1.5 bg-[#C89211]" />
            <h2 className="text-xs uppercase tracking-widest text-[#111111] font-semibold">
              02 / Modificar o Eliminar Artículo
            </h2>
          </div>

          <ProductSelector
            productos={productos}
            productoActual={productoActualObj}
            onSeleccionar={manejarSeleccionarProducto}
            onEliminar={manejarBorrarProducto}
          />

          {edicion.idProductoEditado && productoActualObj && (
            <EditarProductoAdmin
              actualizarDatos={edicion.actualizarDatos}
              setActualizarDatos={edicion.setActualizarDatos}
              imagenesEditor={edicion.imagenesEditor}
              setFotosSeleccionadas={fotos.setFotosSeleccionadas}
              actualizarProducto={manejarActualizarProducto}
              marcarPrincipal={manejarMarcarPrincipal}
              inputClass={inputClass}
              idProductoEditado={edicion.idProductoEditado}
              item={productoActualObj}
              setIdProductoEditado={edicion.cerrarPanel}
              borrarUnaFoto={manejarBorrarFoto}
              previewsPendientes={fotos.previewsPendientes}
            />
          )}
        </section>

      </div>
    </div>
  );
}

export default Dashboard;
