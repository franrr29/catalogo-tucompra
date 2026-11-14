import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-hot-toast";
import CrearNuevoProdct from "./AdminCreateProduct";
import EditarProductoAdmin from "./EditarProducto";
import ProductSelector from "./ProductSelector";
import { useProductosAdmin } from "./hooks/useProductosAdmin";
import { useEdicionProducto } from "./hooks/useEdicionProducto";
import { useFotosPendientes } from "./hooks/useFotosPendientes";
import { Card, CardTitle } from "./ui/Card";
import PageHeader from "./ui/PageHeader";
import Badge from "./ui/Badge";
import { campo } from "./ui/estilos";

const FORM_NUEVO_PRODUCTO = { nombre: "", precio: "", stock: "", imagen: "", descripcion: "" };

function ProductosPage() {
  // la sesion (token y cierre por inactividad) la maneja AdminLayout, que comparte como cerrar la sesion
  // cuando el backend responde 401 en una escritura; el aviso queda visible despues de la redireccion
  const { manejarSesionExpirada } = useOutletContext();

  // el mensaje que mando el backend, o uno generico si no hay
  function mensajeDeError(error, mensajePorDefecto) {
    return error.response?.data?.mensaje || error.response?.data?.error || mensajePorDefecto;
  }

  // lista de productos y sus acciones de alta, baja y modificacion
  const { productos, crearProducto, actualizarProducto, borrarProducto } = useProductosAdmin(manejarSesionExpirada);

  // producto que se esta editando en el panel de abajo
  const edicion = useEdicionProducto(manejarSesionExpirada);

  // fotos elegidas y sus previsualizaciones, para crear o editar
  const fotos = useFotosPendientes(edicion.idProductoEditado, manejarSesionExpirada);

  const [nuevoProducto, setNuevoProducto] = useState(FORM_NUEVO_PRODUCTO);
  const [creando, setCreando] = useState(false);

  // sube las fotos pendientes de un producto. devuelve true si salio bien (o no habia fotos) y false si
  // algo fallo: en ese caso ya se aviso al usuario y no hay que mostrar el mensaje de exito
  async function subirFotosPendientes(productoId) {
    const cantidad = fotos.fotosSeleccionadas ? fotos.fotosSeleccionadas.length : 0;

    try {
      // false = el backend respondio 401: la sesion ya se cerro y se aviso
      return await fotos.subir(productoId);
    } catch (error) {
      const motivo = mensajeDeError(error, "error al subir las imagenes");
      toast.error(`los datos se guardaron, pero fallo la subida de ${cantidad} foto${cantidad === 1 ? "" : "s"}: ${motivo}`);
      return false;
    }
  }

  async function manejarCrearProducto() {
    if (creando) return;
    if (!nuevoProducto.nombre || !nuevoProducto.precio || !nuevoProducto.stock) {
      toast.error("debes completar nombre, precio y stock");
      return;
    }

    setCreando(true);
    try {
      const producto = await crearProducto({
        nombre: nuevoProducto.nombre.trim(),
        precio: Number(nuevoProducto.precio),
        stock: Number(nuevoProducto.stock),
        descripcion: nuevoProducto.descripcion,
      });

      if (producto) {
        setNuevoProducto(FORM_NUEVO_PRODUCTO);
        const fotosSubidas = await subirFotosPendientes(producto.id);
        if (fotosSubidas) toast.success("producto creado");
      }
    } catch (error) {
      const mensaje = error.response?.data?.error || error.response?.data?.mensaje || "error al crear el producto";
      toast.error(mensaje);
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
        Object.entries(edicion.actualizarDatos).filter(([clave, valor]) => clave === "descripcion" || valor !== "")
      );
      const actualizado = await actualizarProducto(id, soloRellenos);
      // false = el backend respondio 401 y ya se cerro la sesion: no se sigue ni se avisa de exito
      if (!actualizado) return;
      const fotosSubidas = await subirFotosPendientes(id);
      await edicion.abrirPanel(id, productos, { rehidratarFormulario: true });
      if (fotosSubidas) toast.success("producto actualizado");
    } catch (error) {
      toast.error(mensajeDeError(error, "error al actualizar"));
    }
  }

  async function manejarBorrarProducto(id) {
    if (!window.confirm("estas seguro de eliminar este producto?")) return;
    try {
      const borrado = await borrarProducto(id);
      if (!borrado) return;
      if (edicion.idProductoEditado === id) {
        edicion.cerrarPanel();
      }
      toast.success("producto eliminado");
    } catch (error) {
      toast.error(mensajeDeError(error, "error al eliminar"));
    }
  }

  async function manejarMarcarPrincipal(imagenId) {
    try {
      const marcada = await edicion.marcarPrincipal(imagenId, edicion.idProductoEditado);
      if (!marcada) return;
      toast.success("portada establecida");
    } catch (error) {
      toast.error(mensajeDeError(error, "error al establecer la portada"));
    }
  }

  async function manejarBorrarFoto(imagenId) {
    try {
      const borrada = await edicion.borrarFoto(imagenId, edicion.idProductoEditado);
      if (!borrada) return;
      toast.success("imagen eliminada");
    } catch (error) {
      toast.error(mensajeDeError(error, "error al eliminar foto"));
    }
  }

  const productoActualObj = productos.find((p) => p.id === Number(edicion.idProductoEditado));

  return (
    <div className="text-ink font-sans antialiased px-4 sm:px-8 py-8 sm:py-10 pb-24">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">

        {/* encabezado de la pagina */}
        <PageHeader titulo="Control de inventario" descripcion="Cargá, editá y eliminá los artículos de la tienda.">
          <Badge variante="oro">
            Activos: <span className="ml-1">{productos.length}</span>
          </Badge>
        </PageHeader>

        {/* seccion para crear un producto nuevo */}
        <Card className="flex flex-col gap-6">
          <CardTitle>Nuevo artículo</CardTitle>
          <CrearNuevoProdct
            nuevoProducto={nuevoProducto}
            setNuevoProducto={setNuevoProducto}
            setFotosSeleccionadas={fotos.setFotosSeleccionadas}
            crearNuevoProducto={manejarCrearProducto}
            creando={creando}
          />
        </Card>

        {/* seccion para modificar o eliminar un producto */}
        <Card className="flex flex-col gap-6">
          <CardTitle>Modificar o eliminar artículo</CardTitle>

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
              inputClass={campo}
              idProductoEditado={edicion.idProductoEditado}
              item={productoActualObj}
              setIdProductoEditado={edicion.cerrarPanel}
              borrarUnaFoto={manejarBorrarFoto}
              previewsPendientes={fotos.previewsPendientes}
            />
          )}
        </Card>

      </div>
    </div>
  );
}

export default ProductosPage;
