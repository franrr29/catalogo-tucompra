import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import CrearNuevoProdct from "./AdminCreateProduct";
import EditarProductoAdmin from "./EditarProducto";
import { API_URL } from "../../config";
import { toast } from "react-hot-toast";

function Dashboard({ isLogIn }) {
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: "", precio: "", stock: "", imagen: "" });
  const [productos, setProductos] = useState([]);
  const [actualizarDatos, setActualizarDatos] = useState({ nombre: "", precio: "", stock: "", imagen: "" });
  const [idProductoEditado, setIdProductoEditado] = useState(null);
  const [fotosSeleccionadas, setFotosSeleccionadas] = useState(null);
  const [imagenesEditor, setImagenesEditor] = useState([]);
  const [creando, setCreando] = useState(false);
  const [previewsPendientes, setPreviewsPendientes] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const dropdownRef = useRef(null);

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

  function resetearTimer() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      adminLogOut();
    }, 15 * 60 * 1000);
  }

  function adminLogOut() {
    localStorage.removeItem("token");
    navigate("/admin/login");
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!fotosSeleccionadas || !idProductoEditado) {
      setPreviewsPendientes([]);
      return;
    }
    const urls = Array.from(fotosSeleccionadas).map(f => URL.createObjectURL(f));
    setPreviewsPendientes(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [fotosSeleccionadas, idProductoEditado]);

  async function subirFotos(productoId) {
    const formData = new FormData();
    Array.from(fotosSeleccionadas).forEach(file => {
      formData.append("imagenes", file);
    });
    try {
      const res = await fetch(`${API_URL}/api/imagenes/${productoId}`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: formData
      });

      if (res.status === 401) {
        adminLogOut();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.mensaje || "Error al subir las imágenes", toastStyle);
        return;
      }
    } catch (error) {
      toast.error("Error de conexión al subir imágenes", toastStyle);
    }
  }

  async function abrirPanelEdicion(id) {
    const numericId = Number(id);
    if (!numericId) {
      setIdProductoEditado(null);
      setImagenesEditor([]);
      setActualizarDatos({ nombre: "", precio: "", stock: "", imagen: "" });
      return;
    }
    try {
      setFotosSeleccionadas(null);
      setImagenesEditor([]);
      setIdProductoEditado(numericId);
      setDropdownOpen(false);

      const productoSeleccionado = productos.find(p => p.id === numericId);
      if (productoSeleccionado) {
        setActualizarDatos({
          nombre: productoSeleccionado.nombre || "",
          precio: productoSeleccionado.precio || "",
          stock: productoSeleccionado.stock || "",
          imagen: ""
        });
      }

      const res = await fetch(`${API_URL}/api/productos/${numericId}`);
      const data = await res.json();
      setImagenesEditor(data.imagenes || []);
    } catch (error) {
      console.error("Error al cargar las imagenes del editor", error);
    }
  }

  useEffect(() => {
    const eventos = ["click", "keydown", "mousemove"];
    eventos.forEach(e => window.addEventListener(e, resetearTimer));
    resetearTimer();

    const token = localStorage.getItem("token");
    if (!token) return navigate("/admin/login");

    getProductos();
    return () => {
      eventos.forEach(e => window.removeEventListener(e, resetearTimer));
      clearTimeout(timerRef.current);
    };
  }, []);

  async function crearNuevoProdct() {
    if (creando) return;
    if (!nuevoProducto.nombre || !nuevoProducto.precio || !nuevoProducto.stock) {
      toast.error("Debes completar nombre, precio y stock", toastStyle);
      return;
    }

    setCreando(true);
    try {
      const datosProducto = {
        nombre: nuevoProducto.nombre.trim(),
        precio: Number(nuevoProducto.precio),
        stock: Number(nuevoProducto.stock),
        imagen: nuevoProducto.imagen.trim() || null
      };

      const resp = await fetch(API_URL + "/api/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify(datosProducto)
      });

      if (resp.status === 401) {
        adminLogOut();
        return;
      }

      const data = await resp.json();

      if (resp.ok) {
        setNuevoProducto({ nombre: "", precio: "", stock: "", imagen: "" });

        if (fotosSeleccionadas !== null) {
          await subirFotos(data.id);
          await getProductos();
          setFotosSeleccionadas(null);
        } else {
          await getProductos();
        }
        toast.success("Producto creado", toastStyle);
      } else {
        toast.error(data.error || data.mensaje || "Error al crear el producto", toastStyle);
      }

    } catch (error) {
      toast.error("Error al crear el producto", toastStyle);
    } finally {
      setCreando(false);
    }
  }

  async function getProductos() {
    try {
      const resp = await fetch(API_URL + "/api/productos");
      const data = await resp.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al traer productos");
    }
  }

  async function borrarProducto(id) {
    const numericId = Number(id);
    if (!numericId) return;
    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      const resp = await fetch(`${API_URL}/api/productos/${numericId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token")
        }
      });

      if (resp.status === 401) {
        adminLogOut();
        return;
      }

      if (resp.ok) {
        setProductos(productos.filter(item => item.id !== numericId));
        if (idProductoEditado === numericId) {
          setIdProductoEditado(null);
          setActualizarDatos({ nombre: "", precio: "", stock: "", imagen: "" });
        }
        toast.success("Producto eliminado", toastStyle);
      }
    } catch (error) {
      toast.error("Error al eliminar", toastStyle);
    }
  }

  async function actualizarProducto(id) {
    try {
      const soloRellenos = Object.fromEntries(
        Object.entries(actualizarDatos).filter(([_, valor]) => valor !== "")
      );
      const resp = await fetch(`${API_URL}/api/productos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify(soloRellenos)
      });

      if (resp.status === 401) {
        adminLogOut();
        return;
      }

      if (resp.ok) {
        if (fotosSeleccionadas !== null) {
          await subirFotos(id);
        }
        setFotosSeleccionadas(null);
        await abrirPanelEdicion(id);
        await getProductos();
        toast.success("Producto actualizado", toastStyle);
      }
    } catch (error) {
      toast.error("Error al actualizar", toastStyle);
    }
  }

  async function marcarPrincipal(imagenId, productoId) {
    try {
      const res = await fetch(`${API_URL}/api/imagenes/${imagenId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token")
        }
      });

      if (res.status === 401) {
        adminLogOut();
        return;
      }

      await res.json();
      await abrirPanelEdicion(productoId);
      await getProductos();
      toast.success("Portada establecida", toastStyle);
    } catch (error) {
      console.error("Error al marcar portada", error);
    }
  }

  async function borrarUnaFoto(imagenId) {
    try {
      const res = await fetch(API_URL + `/api/imagenes/${imagenId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token")
        }
      });

      if (res.status === 401) {
        adminLogOut();
        return;
      }

      if (res.ok) {
        setImagenesEditor(imagenesEditor.filter(imagen => imagen.id !== imagenId));
        getProductos();
        toast.success("Imagen eliminada", toastStyle);
      }
    } catch (error) {
      toast.error("Error al eliminar foto", toastStyle);
    }
  }

  const inputClass = "bg-transparent border border-[#CCCCCC] text-[#111111] text-xs px-4 py-3.5 focus:outline-none focus:border-[#111111] transition-all placeholder-[#999999] w-full font-sans rounded";
  const btnDanger = "border border-red-300 text-red-600 text-xs tracking-wider uppercase px-4 py-3.5 hover:bg-red-600 hover:text-white transition-colors font-sans flex items-center justify-center gap-2 whitespace-nowrap rounded";

  const productoActualObj = productos.find(p => p.id === Number(idProductoEditado));

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
            setFotosSeleccionadas={setFotosSeleccionadas}
            crearNuevoProducto={crearNuevoProdct}
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

          <div className="flex flex-col sm:flex-row gap-3 items-stretch relative" ref={dropdownRef}>

            {/* Dropdown Custom Textual Premium */}
            <div className="flex-1 relative">
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-transparent border border-[#CCCCCC] hover:border-[#111111] text-[#111111] text-xs px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors font-sans uppercase select-none bg-white rounded"
              >
                <span className="truncate font-medium text-[#111111]">
                  {productoActualObj
                    ? `${productoActualObj.nombre} — $${productoActualObj.precio} (Stock: ${productoActualObj.stock})`
                    : "-- Seleccionar producto para editar --"}
                </span>
                <span className={`transform transition-transform duration-200 text-[#C89211] font-bold ml-2 ${dropdownOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </div>

              {/* Lista Desplegable Textual Móvil Optimizada */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-1 bg-[#F4F4F2] border border-[#CCCCCC] rounded z-50 max-h-60 overflow-y-auto shadow-2xl"
                  >
                    {productos.length === 0 ? (
                      <div className="p-4 text-xs font-sans text-[#666666] uppercase text-center">
                        No hay productos disponibles
                      </div>
                    ) : (
                      productos.map((item) => {
                        const isSelected = item.id === idProductoEditado;
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              abrirPanelEdicion(item.id);
                            }}
                            className={`flex flex-col px-4 py-3.5 cursor-pointer border-b border-[#E2E2DF] last:border-b-0 hover:bg-[#E2E2DF] transition-colors ${
                              isSelected ? "bg-[#E2E2DF] font-semibold" : ""
                            }`}
                          >
                            <span className="font-sans text-xs text-[#111111] uppercase">{item.nombre}</span>
                            <span className="font-sans text-[10px] text-[#666666] mt-0.5">
                              Precio: ${item.precio} — Stock: {item.stock} unidades
                            </span>
                          </div>
                        );
                      })
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {idProductoEditado && (
              <button
                onClick={() => borrarProducto(idProductoEditado)}
                className={btnDanger}
              >
                Eliminar
              </button>
            )}
          </div>

          {idProductoEditado && productoActualObj && (
            <EditarProductoAdmin
              actualizarDatos={actualizarDatos}
              setActualizarDatos={setActualizarDatos}
              imagenesEditor={imagenesEditor}
              setFotosSeleccionadas={setFotosSeleccionadas}
              actualizarProducto={actualizarProducto}
              marcarPrincipal={marcarPrincipal}
              inputClass={inputClass}
              idProductoEditado={idProductoEditado}
              item={productoActualObj}
              setIdProductoEditado={setIdProductoEditado}
              borrarUnaFoto={borrarUnaFoto}
              previewsPendientes={previewsPendientes}
            />
          )}
        </section>

      </div>
    </div>
  );
}

export default Dashboard;
