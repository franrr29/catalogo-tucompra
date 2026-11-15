// capturo datos que envia mercado pago cuando se realiza un pago exitoso
const { procesarPagoService } = require("./webhook.service");

// el id del pago es un numero largo; cualquier otra cosa no puede ser un pago real
function leerIdDePago(valor) {
  if (typeof valor !== "string" && typeof valor !== "number") return null;
  const texto = String(valor).trim();
  return /^\d{1,20}$/.test(texto) ? texto : null;
}

// un error de mercado pago 400 o 404 significa que ese pago no existe o el id no sirve (por ejemplo las
// notificaciones de prueba del panel): reintentar no cambia nada, asi que se responde 200 y no se reintenta.
// cualquier otro fallo (base de datos caida, mercado pago 5xx o sin conexion, token invalido) responde 500
// para que mercado pago reintente la notificacion mas tarde
function esIgnorable(error) {
  return error?.status === 400 || error?.status === 404;
}

async function webhook(req, res) {
  // en express 5 el body es undefined si la peticion no trae json
  const body = req.body ?? {};
  const tipo = body.type ?? req.query?.type;

  // los eventos que no son de pagos (merchant_order, etc.) no hacen falta: se confirman y se descartan
  if (tipo !== "payment") {
    return res.status(200).send("ok");
  }

  const pagoId = leerIdDePago(body.data?.id ?? req.query?.["data.id"]);
  if (pagoId === null) {
    console.error("[webhook] evento de pago sin id valido, se ignora");
    return res.status(200).send("ok");
  }

  try {
    await procesarPagoService(pagoId);
    return res.status(200).send("ok");
  } catch (error) {
    // se registra solo el motivo y el id del pago (nunca el body ni el error completo, que pueden tener datos personales)
    const motivo = `${error.code || error.name}: ${error.message}`;

    if (esIgnorable(error)) {
      console.error(`[webhook] pago ${pagoId} ignorado (mercado pago respondio ${error.status}):`, motivo);
      return res.status(200).send("ok");
    }

    console.error(`[webhook] error procesando el pago ${pagoId}, mercado pago reintentara:`, motivo);
    return res.status(500).send("error");
  }
}

module.exports = { webhook, esIgnorable, leerIdDePago };
