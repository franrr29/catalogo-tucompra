import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { obtenerEstadoPedido } from "../../services/pedidos.service";

// cuantas veces se vuelve a preguntar mientras el pedido sigue pendiente (el webhook puede tardar)
export const REINTENTOS_PENDIENTE = 5;
export const ESPERA_REINTENTO_MS = 3000;

const ICONO_CHECK = "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z";
const ICONO_RELOJ = "M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z";
const ICONO_CRUZ = "M9.75 9.75l4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z";

// textos y icono de cada estado de la pantalla
const CONTENIDO = {
  verificando: {
    etiqueta: "VERIFICANDO",
    titulo: "VERIFICANDO",
    destacado: "PAGO",
    texto: "Estamos confirmando tu pago con Mercado Pago.",
    icono: ICONO_RELOJ,
  },
  confirmando: {
    etiqueta: "EN PROCESO",
    titulo: "CONFIRMANDO",
    destacado: "PAGO",
    texto: "Todavía estamos esperando la confirmación de tu pago. Puede tardar unos segundos, no cierres esta página.",
    icono: ICONO_RELOJ,
  },
  pagado: {
    etiqueta: "PEDIDO CONFIRMADO",
    titulo: "PAGO",
    destacado: "EXITOSO",
    texto: "Tu compra fue procesada correctamente. Coordinamos la entrega por WhatsApp.",
    icono: ICONO_CHECK,
  },
  cancelado: {
    etiqueta: "PAGO NO PROCESADO",
    titulo: "PAGO",
    destacado: "CANCELADO",
    texto: "El pago fue rechazado o cancelado. Tu carrito sigue guardado para que lo intentes de nuevo.",
    icono: ICONO_CRUZ,
  },
  sinConfirmar: {
    etiqueta: "SIN CONFIRMAR",
    titulo: "PAGO",
    destacado: "PENDIENTE",
    texto: "Todavía no recibimos la confirmación de tu pago. Si ya pagaste, puede demorar unos minutos. Tu carrito sigue guardado.",
    icono: ICONO_RELOJ,
  },
  error: {
    etiqueta: "SIN CONEXIÓN",
    titulo: "NO PUDIMOS",
    destacado: "VERIFICAR",
    texto: "Hubo un problema de conexión al verificar tu pago. Tu carrito sigue guardado.",
    icono: ICONO_CRUZ,
  },
  noEncontrado: {
    etiqueta: "PEDIDO NO ENCONTRADO",
    titulo: "PEDIDO",
    destacado: "NO ENCONTRADO",
    texto: "No encontramos el pedido que intentás confirmar.",
    icono: ICONO_CRUZ,
  },
  sinPedido: {
    etiqueta: "SIN PEDIDO",
    titulo: "PEDIDO",
    destacado: "NO IDENTIFICADO",
    texto: "No pudimos identificar tu pedido desde esta página.",
    icono: ICONO_CRUZ,
  },
};

const clasesBotonPrimario = "text-xs text-paper bg-brand hover:bg-[#A3740A] px-8 py-3.5 transition-colors uppercase tracking-wider font-sans inline-block";
const clasesBotonSecundario = "text-xs text-ink border border-border hover:border-[#111111] hover:bg-[#111111] hover:text-paper px-8 py-3.5 transition-all uppercase tracking-wider font-sans inline-block";

function leerCarritoGuardado() {
  try {
    const guardado = localStorage.getItem("productos");
    return guardado ? JSON.parse(guardado) : [];
  } catch (error) {
    return [];
  }
}

// mercado pago devuelve el id del pedido en external_reference; si no llega se usa el que guardo el checkout
function leerIdDelPedido(params) {
  const id = params.get("external_reference") || localStorage.getItem("pedidoId");
  return /^\d+$/.test(id || "") && Number(id) > 0 ? id : null;
}

// pagina de retorno de mercado pago: confirma el estado real del pedido antes de dar el pago por exitoso
// esperaMs se puede cambiar solo para los tests
function Exito({ setCarrito, esperaMs = ESPERA_REINTENTO_MS }) {
  const [params] = useSearchParams();
  // se leen una sola vez al montar, antes de que el carrito se vacie
  const [carritoGuardado] = useState(leerCarritoGuardado);
  const [pedidoId] = useState(() => leerIdDelPedido(params));
  const [estado, setEstado] = useState(pedidoId ? "verificando" : "sinPedido");
  // cada click en "verificar de nuevo" suma uno y vuelve a correr la verificacion
  const [verificaciones, setVerificaciones] = useState(0);

  useEffect(() => {
    if (!pedidoId) return;

    let cancelado = false;
    let temporizador;

    async function verificar(reintentosRestantes) {
      try {
        const estadoPedido = await obtenerEstadoPedido(pedidoId);
        if (cancelado) return;

        if (estadoPedido === "pagado") {
          setEstado("pagado");
        } else if (estadoPedido === "cancelado") {
          setEstado("cancelado");
        } else if (reintentosRestantes > 0) {
          // sigue pendiente: el webhook todavia no llego, se espera y se vuelve a preguntar
          setEstado("confirmando");
          temporizador = setTimeout(() => verificar(reintentosRestantes - 1), esperaMs);
        } else {
          setEstado("sinConfirmar");
        }
      } catch (error) {
        if (cancelado) return;
        setEstado(error.response?.status === 404 ? "noEncontrado" : "error");
      }
    }

    setEstado("verificando");
    verificar(REINTENTOS_PENDIENTE);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [pedidoId, verificaciones, esperaMs]);

  // el carrito solo se vacia cuando el backend confirma que el pedido esta pagado
  useEffect(() => {
    if (estado !== "pagado") return;
    if (setCarrito) setCarrito([]);
    localStorage.removeItem("productos");
    localStorage.removeItem("pedidoId");
  }, [estado, setCarrito]);

  function whatsapp() {
    const productos = carritoGuardado
      .map((prod) => `• ${prod.nombre} × ${prod.cantidad} — $${prod.precio * prod.cantidad}`)
      .join("\n");

    const total = carritoGuardado.reduce(
      (acc, prod) => acc + prod.precio * prod.cantidad,
      0
    );

    const mensaje = `¡Hola! 👋\n\nRealicé el pago de mi pedido correctamente ✅\n\n
    📦 *Detalle del pedido:*\n${productos}\n\n
    💰 *Total pagado: $${total}*\n\n
    El pago fue realizado exitosamente. Quedo a la espera de la confirmación y coordinación de la entrega.\n\n
    ¡Muchas gracias!`;

    window.open(
      `https://wa.me/59891637161?text=${encodeURIComponent(mensaje)}`,
      "_blank"
    );
  }

  const contenido = CONTENIDO[estado];

  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased flex flex-col items-center justify-center px-6 selection:bg-[#E2E2DF]">

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-auto"
      >
        <div className="flex items-center justify-center gap-2 mb-6 font-sans">
          <span className="w-1.5 h-1.5 bg-brand" />
          <span className="text-[11px] text-muted uppercase tracking-widest">
            {contenido.etiqueta}
          </span>
        </div>

        <div className="flex justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-14 h-14 text-brand">
            <path strokeLinecap="round" strokeLinejoin="round" d={contenido.icono} />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-ink mb-6 font-sans">
          {contenido.titulo} <span className="font-medium text-brand">{contenido.destacado}</span>
        </h1>

        <div className="flex flex-col items-center gap-3 mb-12">
          <p className="text-xs text-muted leading-relaxed font-sans">
            {contenido.texto}
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          {estado === "pagado" && carritoGuardado.length > 0 && (
            <button onClick={whatsapp} className={clasesBotonPrimario}>
              Contactar por WhatsApp
            </button>
          )}

          {(estado === "sinConfirmar" || estado === "error") && (
            <button onClick={() => setVerificaciones((n) => n + 1)} className={clasesBotonPrimario}>
              Verificar de nuevo
            </button>
          )}

          {estado === "cancelado" && (
            <Link to="/carrito" className={clasesBotonPrimario}>
              Volver al carrito
            </Link>
          )}

          <Link to="/" className={clasesBotonSecundario}>
            Volver al inicio
          </Link>
        </div>
      </motion.div>

    </div>
  );
}

export default Exito;
