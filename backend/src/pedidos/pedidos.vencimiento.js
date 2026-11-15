const baseDatos = require("../config/db");

// minutos que un pedido pendiente retiene el stock antes de vencer
const EXPIRA_MIN_DEFECTO = 60;
// maximo de pedidos que se cancelan en cada pasada, para que ninguna request quede esperando mucho
const LOTE_MAXIMO = 50;
// como mucho una pasada por minuto en cada instancia: render se duerme, no hay cron, y barrer en cada request seria un gasto inutil
const INTERVALO_MINIMO_MS = 60 * 1000;

// PEDIDO_EXPIRA_MIN: entero positivo; si falta o no sirve se usa el valor por defecto (nunca rompe el arranque)
function leerMinutosDeVencimiento(valor = process.env.PEDIDO_EXPIRA_MIN) {
  const texto = String(valor ?? "").trim();
  if (!/^\d+$/.test(texto)) return EXPIRA_MIN_DEFECTO;
  const minutos = Number(texto);
  return Number.isSafeInteger(minutos) && minutos > 0 ? minutos : EXPIRA_MIN_DEFECTO;
}

// ventana de validez de la preferencia de mercado pago (campos expires, expiration_date_from y expiration_date_to,
// ISO 8601 con offset): pasado PEDIDO_EXPIRA_MIN el checkout ya no permite pagar, igual que el pedido deja de retener stock.
// no afecta a un boleto offline ya generado: ese tiene su propio plazo en mercado pago
function ventanaDeVencimiento(ahora = new Date(), minutos = leerMinutosDeVencimiento()) {
  const formato = (fecha) => fecha.toISOString().replace("Z", "+00:00");
  return {
    expires: true,
    expiration_date_from: formato(ahora),
    expiration_date_to: formato(new Date(ahora.getTime() + minutos * 60 * 1000)),
  };
}

let ultimaPasada = 0;

// cancela un pedido vencido y devuelve su stock, en una transaccion. devuelve true si lo cancelo.
// se vuelve a comprobar todo con el pedido bloqueado: si mientras tanto se pago o llego un pago pendiente, no se toca
async function cancelarPedidoVencido(id, minutos) {
  const conexion = await baseDatos.getConnection();

  try {
    await conexion.beginTransaction();

    const [pedidos] = await conexion.query(
      `SELECT estado, mercadopago_id, fecha < DATE_SUB(NOW(), INTERVAL ? MINUTE) AS vencido
       FROM pedidos WHERE id = ? FOR UPDATE`,
      [minutos, id]
    );

    const pedido = pedidos[0];
    if (!pedido || pedido.estado !== "pendiente" || pedido.mercadopago_id != null || !pedido.vencido) {
      await conexion.rollback();
      return false;
    }

    // ordenados por producto para bloquear siempre en el mismo orden y evitar deadlocks
    const [items] = await conexion.query(
      "SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = ? ORDER BY producto_id",
      [id]
    );

    for (const item of items) {
      await conexion.query("UPDATE productos SET stock = stock + ? WHERE id = ?", [item.cantidad, item.producto_id]);
    }

    await conexion.query("UPDATE pedidos SET estado = 'cancelado' WHERE id = ? AND estado = 'pendiente'", [id]);

    await conexion.commit();
    return true;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// cancela los pedidos pendientes que superaron PEDIDO_EXPIRA_MIN y devuelve su stock.
// NO toca los que ya tienen un pago en curso (mercadopago_id cargado): un pago offline puede tardar dias en confirmarse.
// nunca lanza: si falla se registra el motivo y quien la llamo sigue con lo suyo
async function liberarPedidosVencidos({ forzar = false } = {}) {
  const ahora = Date.now();
  if (!forzar && ahora - ultimaPasada < INTERVALO_MINIMO_MS) return 0;
  ultimaPasada = ahora;

  try {
    const minutos = leerMinutosDeVencimiento();

    const [candidatos] = await baseDatos.query(
      `SELECT id FROM pedidos
       WHERE estado = 'pendiente' AND mercadopago_id IS NULL AND fecha < DATE_SUB(NOW(), INTERVAL ? MINUTE)
       ORDER BY id LIMIT ?`,
      [minutos, LOTE_MAXIMO]
    );

    const cancelados = [];
    for (const { id } of candidatos) {
      try {
        if (await cancelarPedidoVencido(id, minutos)) cancelados.push(id);
      } catch (error) {
        console.error(`no se pudo cancelar el pedido vencido ${id}:`, error.code || error.name, error.message);
      }
    }

    if (cancelados.length > 0) {
      console.log(`pedidos vencidos cancelados (stock liberado): ${cancelados.join(", ")}`);
    }
    return cancelados.length;
  } catch (error) {
    console.error("no se pudo liberar los pedidos vencidos:", error.code || error.name, error.message);
    return 0;
  }
}

// solo para los tests: reinicia el limitador de pasadas
function reiniciarLimitador() {
  ultimaPasada = 0;
}

module.exports = {
  liberarPedidosVencidos,
  cancelarPedidoVencido,
  leerMinutosDeVencimiento,
  ventanaDeVencimiento,
  reiniciarLimitador,
  EXPIRA_MIN_DEFECTO,
  LOTE_MAXIMO,
};
