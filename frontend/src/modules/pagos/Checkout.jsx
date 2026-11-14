import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { crearPago } from "../../services/pedidos.service";
import FormularioEnvio from "./FormularioEnvio";
import { FORM_INICIAL, validarFormulario, armarPedido, idCampo } from "./validacionEnvio";

const MENSAJE_ERROR_GENERICO = "No pudimos iniciar el pago. Intenta nuevamente.";

// formulario de checkout: datos de contacto y de envio, y despues el pago
function Checkout() {
  const [form, setForm] = useState(FORM_INICIAL);
  // campos que el usuario ya toco: solo a esos se les muestra el error mientras escribe
  const [tocados, setTocados] = useState({});
  // despues del primer intento de enviar se muestran todos los errores
  const [intentoEnvio, setIntentoEnvio] = useState(false);
  // error de un campo puntual que devolvio el backend; se limpia cuando el usuario lo edita
  const [errorServidor, setErrorServidor] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // resetea el boton si vuelve desde mercado pago con la pagina en cache
  useEffect(() => {
    function handlePageShow(event) {
      if (event.persisted) {
        setEnviando(false);
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const items = localStorage.getItem("productos")
    ? JSON.parse(localStorage.getItem("productos"))
    : [];

  const itemFormateado = items.map((producto) => ({
    productoId: producto.id,
    cantidad: producto.cantidad,
  }));

  const total = items.reduce(
    (acc, prod) => acc + parseFloat(prod.precio) * prod.cantidad,
    0
  );

  const erroresDelFormulario = validarFormulario(form);

  // errores que se muestran ahora: los del formulario ya tocados (o todos tras intentar enviar) y el del servidor
  const erroresVisibles = {};
  Object.keys(erroresDelFormulario).forEach((campo) => {
    if (intentoEnvio || tocados[campo]) erroresVisibles[campo] = erroresDelFormulario[campo];
  });
  if (errorServidor) erroresVisibles[errorServidor.campo] = errorServidor.mensaje;

  function cambiarCampo(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
    if (errorServidor?.campo === campo) setErrorServidor(null);
  }

  function marcarTocado(campo) {
    setTocados((actual) => ({ ...actual, [campo]: true }));
  }

  function enfocar(campo) {
    document.getElementById(idCampo(campo))?.focus();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setErrorServidor(null);
    setIntentoEnvio(true);

    // el primer campo con error recibe el foco y no se envia nada al backend
    const primerError = Object.keys(validarFormulario(form))[0];
    if (primerError) {
      enfocar(primerError);
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await crearPago(armarPedido(form, itemFormateado));
      // respaldo por si mercado pago no devuelve external_reference en la url de retorno
      localStorage.setItem("pedidoId", String(respuesta.pedido.id));
      window.location.href = respuesta.pedido.init_point;
    } catch (err) {
      console.error("Error al crear el pago");
      const datos = err?.response?.data;
      const status = err?.response?.status;

      if (datos?.campo && datos.campo in FORM_INICIAL) {
        // el backend senalo un campo: el mensaje se muestra ahi
        setErrorServidor({ campo: datos.campo, mensaje: datos.mensaje });
        enfocar(datos.campo);
      } else {
        setError(status >= 500 ? MENSAJE_ERROR_GENERICO : datos?.mensaje || MENSAJE_ERROR_GENERICO);
      }
      setEnviando(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-paper text-ink font-sans antialiased px-6 sm:px-12 lg:px-16 pt-32 pb-24">
        <div className="max-w-2xl mx-auto rounded-2xl border border-[#1A1A1A]/15 bg-white/40 backdrop-blur-md p-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 bg-brand" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              CARRITO VACÍO
            </span>
          </div>
          <h3 className="text-2xl font-light mb-2">
            No hay productos para pagar
          </h3>
          <p className="text-sm text-muted mb-8">
            Agregá artículos desde el catálogo para continuar con el pago.
          </p>
          <Link
            to="/"
            className="inline-block rounded-xl text-sm text-white bg-ink-soft hover:bg-brand px-8 py-4 transition-colors uppercase tracking-widest font-semibold"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased px-6 sm:px-12 lg:px-16 pt-32 pb-24">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16 border-b border-border pb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 bg-brand" />
            <span className="text-xs font-semibold">DATOS DE ENVÍO Y PAGO</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-light tracking-tight">
            FINALIZAR <span className="font-semibold text-brand">COMPRA</span>
          </h1>
        </header>

        <div className="flex flex-col gap-12">
          {/* formulario */}
          <form onSubmit={handleSubmit} noValidate className="flex-1 flex flex-col gap-6">
            <FormularioEnvio
              form={form}
              errores={erroresVisibles}
              onCambio={cambiarCampo}
              onBlur={marcarTocado}
            />

            <p className="text-xs text-[#888888]">
              Usamos tus datos solo para gestionar el envío.
            </p>

            {error && (
              <p role="alert" className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className={`w-full rounded-xl text-sm text-white px-8 py-4 transition-colors uppercase tracking-widest font-semibold mt-2 ${
                enviando
                  ? "bg-[#D1D1D1] text-[#888888] cursor-not-allowed"
                  : "bg-ink-soft hover:bg-brand"
              }`}
            >
              {enviando ? "Procesando..." : "Pagar con Mercado Pago"}
            </button>
          </form>

          {/* resumen del pedido */}
          <aside className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-white/40 backdrop-blur-md p-6 h-fit flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="w-1.5 h-1.5 bg-brand" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Resumen del pedido
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {items.map((prod) => (
                <div key={prod.id} className="flex justify-between text-sm gap-2">
                  <span className="text-[#333333]">
                    {prod.nombre} <span className="text-[#888888]">x{prod.cantidad}</span>
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    ${(parseFloat(prod.precio) * prod.cantidad).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-baseline border-t border-border pt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-light">
                Total
              </span>
              <span className="text-2xl font-light">
                <span className="text-brand text-lg mr-1">$</span>
                {total.toLocaleString()}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
