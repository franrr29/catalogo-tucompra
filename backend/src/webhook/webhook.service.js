const { Payment } = require("mercadopago");
const mp = require("../config/mercadoPago");
const baseDatos = require("../config/db");

// el pedido llega en external_reference del pago, que se consulta a mercado pago (no viene del body del webhook).
// pedidos.id es un INT: solo se acepta un entero positivo de ese tamano
const ID_MAXIMO = 2147483647;

function leerReferencia(referencia) {
  if (typeof referencia !== "string" && typeof referencia !== "number") return null;
  const texto = String(referencia).trim();
  if (!/^\d{1,10}$/.test(texto)) return null;
  const id = Number(texto);
  return id > 0 && id <= ID_MAXIMO ? id : null;
}

// compara montos en centavos para evitar errores de coma flotante (total llega como texto desde mysql)
function enCentavos(monto) {
  return Math.round(Number(monto) * 100);
}

// deja en el log solo ids, estados y montos: nunca datos de la persona (nombre, email, telefono, direccion...)
function registrar(evento, datos) {
  console.error(`[webhook] ${evento}`, JSON.stringify(datos));
}

// corre el trabajo dentro de una transaccion: commit si termina bien, rollback y error si falla
async function enTransaccion(trabajo) {
  const conexion = await baseDatos.getConnection();

  try {
    await conexion.beginTransaction();
    const resultado = await trabajo(conexion);
    await conexion.commit();
    return resultado;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// pago aprobado: pasa el pedido a pagado, una sola vez y solo si el monto coincide
async function registrarPagoAprobado(pedidoId, pago, idPago) {
  return enTransaccion(async (conexion) => {
    const [pedidos] = await conexion.query(
      "SELECT estado, total, mercadopago_id FROM pedidos WHERE id = ? FOR UPDATE",
      [pedidoId]
    );

    if (pedidos.length === 0) {
      registrar("PEDIDO_INEXISTENTE", { pedidoId, pagoId: idPago });
      return "ignorado";
    }

    const pedido = pedidos[0];

    // un pedido pagado no cambia nunca: un evento repetido o tardio no debe tocarlo
    if (pedido.estado === "pagado") {
      if (pedido.mercadopago_id && pedido.mercadopago_id !== idPago) {
        // dos pagos distintos aprobados para el mismo pedido: el segundo hay que devolverlo a mano
        registrar("PAGO_DUPLICADO_REEMBOLSO_MANUAL", { pedidoId, pagoId: idPago, pagoRegistrado: pedido.mercadopago_id });
      }
      return "ya_pagado";
    }

    // el monto que mercado pago cobro tiene que ser el del pedido; si no, no se marca pagado y se avisa
    if (enCentavos(pago.transaction_amount) !== enCentavos(pedido.total)) {
      registrar("PAGO_MONTO_DISTINTO_REVISAR", {
        pedidoId,
        pagoId: idPago,
        montoPago: pago.transaction_amount,
        montoPedido: pedido.total,
      });
      return "monto_distinto";
    }

    if (pedido.estado === "cancelado") {
      // el stock ya fue devuelto: no se puede marcar pagado sin volver a reservarlo
      registrar("PAGO_APROBADO_SOBRE_PEDIDO_CANCELADO_REVISAR", { pedidoId, pagoId: idPago });
      return "cancelado_sin_reserva";
    }

    // el stock ya estaba reservado desde que se creo el pedido
    await conexion.query(
      "UPDATE pedidos SET estado = 'pagado', mercadopago_id = ? WHERE id = ? AND estado = 'pendiente'",
      [idPago, pedidoId]
    );
    return "pagado";
  });
}

// pago rechazado o cancelado: libera el stock reservado, solo si el pedido sigue pendiente
async function registrarPagoFallido(pedidoId, idPago) {
  return enTransaccion(async (conexion) => {
    // evito restaurar el stock dos veces si llega la notificacion repetida
    const [pedidos] = await conexion.query("SELECT estado FROM pedidos WHERE id = ? FOR UPDATE", [pedidoId]);

    if (pedidos.length === 0 || pedidos[0].estado !== "pendiente") {
      return "ignorado";
    }

    // ordenados por producto para bloquear siempre en el mismo orden y evitar deadlocks
    const [items] = await conexion.query(
      "SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = ? ORDER BY producto_id",
      [pedidoId]
    );

    for (const item of items) {
      await conexion.query("UPDATE productos SET stock = stock + ? WHERE id = ?", [item.cantidad, item.producto_id]);
    }

    await conexion.query(
      "UPDATE pedidos SET estado = 'cancelado', mercadopago_id = ? WHERE id = ? AND estado = 'pendiente'",
      [idPago, pedidoId]
    );
    return "cancelado";
  });
}

// consulta el pago a mercado pago y actualiza el pedido segun su estado real
async function procesarPagoService(pagoId) {
  const pago = await new Payment(mp).get({ id: pagoId });
  const idPago = String(pago.id ?? pagoId);
  const pedidoId = leerReferencia(pago.external_reference);

  if (pedidoId === null) {
    registrar("PAGO_SIN_REFERENCIA_VALIDA", { pagoId: idPago, estadoPago: pago.status });
    return "ignorado";
  }

  if (pago.status === "approved") {
    return registrarPagoAprobado(pedidoId, pago, idPago);
  }

  if (pago.status === "rejected" || pago.status === "cancelled") {
    return registrarPagoFallido(pedidoId, idPago);
  }

  // cualquier otro estado (pendiente, en proceso, devuelto...) no cambia el pedido
  return "ignorado";
}

module.exports = { procesarPagoService, leerReferencia };
