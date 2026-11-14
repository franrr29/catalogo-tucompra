import { useState, useCallback } from "react";
import * as adminService from "../../../services/admin.service";
import { obtenerProducto } from "../../../services/productos.service";
import { costoComoTexto } from "../costos";

const FORM_VACIO = { nombre: "", precio: "", stock: "", imagen: "", descripcion: "", costo: "" };

// arma el formulario a partir de un producto (de la lista o del detalle); ?? deja pasar el stock 0
// el costo solo viene en la lista del panel: el detalle publico no lo trae (queda "" si no esta)
function formDesdeProducto(producto) {
  return {
    nombre: producto.nombre ?? "",
    precio: producto.precio ?? "",
    stock: producto.stock ?? "",
    imagen: "",
    descripcion: producto.descripcion ?? "",
    costo: costoComoTexto(producto.costo),
  };
}

// pide las imagenes frescas del producto al servidor; devuelve null si el pedido falla
async function traerImagenes(productoId) {
  try {
    const data = await obtenerProducto(productoId, { fresco: true });
    return data.imagenes || [];
  } catch (error) {
    return null;
  }
}

// maneja el producto que se esta editando: sus datos, sus imagenes y el panel
export function useEdicionProducto(onUnauthorized) {
  const [idProductoEditado, setIdProductoEditado] = useState(null);
  const [actualizarDatos, setActualizarDatos] = useState(FORM_VACIO);
  const [imagenesEditor, setImagenesEditor] = useState([]);

  // al abrir un producto el formulario sale de la lista; con rehidratarFormulario (despues de guardar)
  // sale del detalle fresco del servidor, porque la lista que recibe puede ser la de antes de guardar
  const abrirPanel = useCallback(async (id, productos, { rehidratarFormulario = false } = {}) => {
    const numericId = Number(id);

    if (!numericId) {
      setIdProductoEditado(null);
      setImagenesEditor([]);
      setActualizarDatos(FORM_VACIO);
      return;
    }

    try {
      setIdProductoEditado(numericId);

      const productoSeleccionado = productos.find((p) => p.id === numericId);
      if (productoSeleccionado) {
        // al rehidratar, la lista puede ser la de antes de guardar: el costo guardado no se pisa con el de la lista
        setActualizarDatos(
          rehidratarFormulario
            ? (actual) => ({ ...formDesdeProducto(productoSeleccionado), costo: actual.costo })
            : formDesdeProducto(productoSeleccionado)
        );
      }

      const data = await obtenerProducto(numericId, { fresco: true });
      setImagenesEditor(data.imagenes || []);
      if (rehidratarFormulario) {
        // el detalle publico no trae el costo: se conserva el que acaba de guardarse en el formulario,
        // si no el costo se borraria en el siguiente guardado
        setActualizarDatos((actual) => ({ ...formDesdeProducto(data), costo: actual.costo }));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        onUnauthorized();
        return;
      }
      console.error("error al cargar las imagenes del editor", error);
    }
  }, [onUnauthorized]);

  const cerrarPanel = useCallback(() => {
    setIdProductoEditado(null);
    setActualizarDatos(FORM_VACIO);
  }, []);

  const marcarPrincipal = useCallback(async (imagenId, productoId) => {
    try {
      await adminService.marcarImagenPrincipal(imagenId);

      // solo se refrescan las imagenes: el formulario puede tener cambios sin guardar y no se toca
      // si el pedido falla, se refleja lo mismo que hizo el backend: la elegida pasa a orden 0 y el resto a 1
      const imagenes = await traerImagenes(productoId);
      if (imagenes) {
        setImagenesEditor(imagenes);
      } else {
        setImagenesEditor((actuales) =>
          actuales.map((imagen) => ({ ...imagen, orden: imagen.id === imagenId ? 0 : 1 }))
        );
      }
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        onUnauthorized();
        return false;
      }
      throw error;
    }
  }, [onUnauthorized]);

  const borrarFoto = useCallback(async (imagenId, productoId) => {
    try {
      await adminService.borrarImagen(imagenId);

      // se vuelven a pedir las imagenes al servidor (asi se ve la nueva portada si se borro la principal)
      // sin tocar lo que se este escribiendo en el formulario; si el pedido falla se quita solo la foto borrada
      const imagenes = await traerImagenes(productoId);
      if (imagenes) {
        setImagenesEditor(imagenes);
      } else {
        setImagenesEditor((actuales) => actuales.filter((imagen) => imagen.id !== imagenId));
      }
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        onUnauthorized();
        return false;
      }
      throw error;
    }
  }, [onUnauthorized]);

  return {
    idProductoEditado,
    actualizarDatos,
    setActualizarDatos,
    imagenesEditor,
    abrirPanel,
    cerrarPanel,
    marcarPrincipal,
    borrarFoto,
  };
}
