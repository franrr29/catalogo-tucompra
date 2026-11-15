// verificacion de la firma x-signature de las notificaciones de mercado pago, con el validador que trae el sdk
// (HMAC-SHA256 del manifiesto "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" con el secreto del panel de mp).
//
// MP_WEBHOOK_FIRMA define que se hace con el resultado:
//  - off:       no se verifica nada (por defecto mientras no haya MP_WEBHOOK_SECRET)
//  - registrar: se verifica y se deja el resultado en el log, pero la notificacion se procesa igual. sirve para
//               comprobar durante unos dias que lo legitimo llega con firma valida antes de empezar a rechazar
//  - exigir:    una firma ausente o invalida se rechaza con 401 y no se procesa
// si MP_WEBHOOK_SECRET esta cargado y MP_WEBHOOK_FIRMA no, el modo es "registrar"
const { WebhookSignatureValidator, InvalidWebhookSignatureError } = require("mercadopago");

const MODOS = ["off", "registrar", "exigir"];

function leerModo(entorno = process.env) {
  const pedido = String(entorno.MP_WEBHOOK_FIRMA || "").trim().toLowerCase();
  if (MODOS.includes(pedido)) return pedido;
  // un valor desconocido no apaga la proteccion por error: se usa el modo mas permisivo que igual verifica
  if (pedido) return "registrar";
  return entorno.MP_WEBHOOK_SECRET ? "registrar" : "off";
}

// segundos entre el ts de la firma y ahora, para decidir mas adelante una tolerancia contra repeticiones
function edadDeLaFirma(xSignature) {
  const coincidencia = /(?:^|[,\s])ts=(\d+)/.exec(String(xSignature || ""));
  if (!coincidencia) return null;
  return Math.round(Date.now() / 1000 - Number(coincidencia[1]));
}

let avisoSinSecretoMostrado = false;

function verificarFirmaWebhook(req, res, next) {
  const modo = leerModo();
  if (modo === "off") return next();

  const secreto = process.env.MP_WEBHOOK_SECRET;
  if (!secreto) {
    // configuracion incompleta: no se puede verificar nada
    if (!avisoSinSecretoMostrado) {
      avisoSinSecretoMostrado = true;
      console.error(`[webhook] MP_WEBHOOK_FIRMA=${modo} pero falta MP_WEBHOOK_SECRET: no se puede verificar la firma`);
    }
    // en "exigir" se falla cerrado con 500 para que mercado pago reintente cuando se corrija la configuracion
    return modo === "exigir" ? res.status(500).send("error") : next();
  }

  // mercado pago firma con el data.id de la url; si no viene ahi se usa el del body
  const dataId = req.query?.["data.id"] ?? req.body?.data?.id;
  const xSignature = req.get("x-signature");
  const xRequestId = req.get("x-request-id");

  let resultado = "valida";
  let motivo;
  try {
    WebhookSignatureValidator.validate({ xSignature, xRequestId, dataId, secret: secreto });
  } catch (error) {
    resultado = "invalida";
    motivo = error instanceof InvalidWebhookSignatureError ? error.reason : "error_inesperado";
  }

  // el log lleva solo ids y la edad de la firma: nunca la firma, el secreto ni datos personales
  const datos = { resultado, motivo, pagoId: dataId === undefined ? null : String(dataId), requestId: xRequestId || null, edadSegundos: edadDeLaFirma(xSignature), modo };
  if (resultado === "valida") {
    console.log("[webhook] firma", JSON.stringify(datos));
  } else {
    console.error("[webhook] firma", JSON.stringify(datos));
  }

  if (resultado === "invalida" && modo === "exigir") {
    return res.status(401).send("firma invalida");
  }
  next();
}

module.exports = { verificarFirmaWebhook, leerModo, edadDeLaFirma };
