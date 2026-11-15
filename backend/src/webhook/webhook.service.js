const { Payment } = require("mercadopago");
const mp = require("../config/mercadoPago");
const baseDatos = require("../config/db");

// el pedido llega en external_reference del pago, que se consulta a mercado pago (no viene del body del webhook).
// pedidos.id es un INT: solo se acepta un entero positivo de ese tamano
const ID_MAXIMO = 2147483647;

// estados de un pago que todavia puede terminar en aprobado
const ESTADOS_EN_CURSO = ["pending", "in_process", "in_mediation", "authorized"];

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

// el pago ya se cobro pero el pedido estaba cancelado y el stock se vendio a otro: hay que reembolsar a mano
class StockInsuficienteError extends Error {
  constructor(productoId) {
    super("stock insuficiente para re-reservar");
    this.productoId = productoId;
  }
}

// pago aprobado: pasa el pedido a pagado, una sola vez y solo si el monto coincide.
// si el pedido estaba cancelado (pago tardio) vuelve a reservar el stock en la misma transaccion
async function registrarPagoAprobado(pedidoId, pago, idPago) {
  try {
    return await aprobarEnTransaccion(pedidoId, pago, idPago);
  } catch (error) {
    if (!(error instanceof StockInsuficienteError)) throw error;

    // la transaccion ya hizo rollback: el pedido sigue cancelado y no se marca pagado.
    // el log lleva solo ids para que el reembolso se haga a mano en mercado pago
    registrar("PAGO_APROBADO_SIN_STOCK_REEMBOLSO_MANUAL", { pedidoId, pagoId: idPago, productoId: error.productoId });

    // se guarda el id del pago en el pedido para que se vea en el panel cual hay que devolver (mejor esfuerzo)
    try {
      await baseDatos.query("UPDATE pedidos SET mercadopago_id = ? WHERE id = ? AND estado = 'cancelado'", [idPago, pedidoId]);
    } catch (errorGuardado) {
      registrar("NO_SE_PUDO_GUARDAR_EL_PAGO_HUERFANO", { pedidoId, pagoId: idPago, motivo: errorGuardado.code || errorGuardado.name });
    }
    return "sin_stock";
  }
}

async function aprobarEnTransaccion(pedidoId, pago, idPago) {
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
      // el stock ya fue devuelto al cancelar: se vuelve a reservar. ordenados por producto para bloquear siempre en el
      // mismo orden; stock >= ? evita que quede negativo. no se filtra por activo: el dinero ya entro
      const [items] = await conexion.query(
        "SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = ? ORDER BY producto_id",
        [pedidoId]
      );

      for (const item of items) {
        const [reserva] = await conexion.query(
          "UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?",
          [item.cantidad, item.producto_id, item.cantidad]
        );
        if (reserva.affectedRows === 0) {
          throw new StockInsuficienteError(item.producto_id);
        }
      }

      await conexion.query(
        "UPDATE pedidos SET estado = 'pagado', mercadopago_id = ? WHERE id = ? AND estado = 'cancelado'",
        [idPago, pedidoId]
      );
      registrar("PAGO_TARDIO_STOCK_RESERVADO", { pedidoId, pagoId: idPago });
      return "pagado_tras_cancelacion";
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
    const [pedidos] = await conexion.query(
      "SELECT estado, mercadopago_id FROM pedidos WHERE id = ? FOR UPDATE",
      [pedidoId]
    );

    if (pedidos.length === 0 || pedidos[0].estado !== "pendiente") {
      return "ignorado";
    }

    // si el pedido tiene OTRO pago en curso (por ejemplo un boleto offline pendiente), el rechazo de este intento
    // no lo cancela: el comprador puede seguir pagando con el otro
    if (pedidos[0].mercadopago_id && pedidos[0].mercadopago_id !== idPago) {
      return "ignorado_otro_pago_en_curso";
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

// pago en curso (pendiente, en proceso, en revision, autorizado): todavia no es ni pagado ni fallido.
// se guarda su id en el pedido: asi se sabe que hay un pago en camino y el barrido de pedidos vencidos no lo cancela.
// mercadopago_id solo se escribe desde aqui y cuando mercado pago reporta un pago, nunca al crear la preferencia
async function registrarPagoEnCurso(pedidoId, idPago) {
  return enTransaccion(async (conexion) => {
    const [pedidos] = await conexion.query("SELECT estado FROM pedidos WHERE id = ? FOR UPDATE", [pedidoId]);

    if (pedidos.length === 0 || pedidos[0].estado !== "pendiente") {
      return "ignorado";
    }

    await conexion.query("UPDATE pedidos SET mercadopago_id = ? WHERE id = ? AND estado = 'pendiente'", [idPago, pedidoId]);
    return "pago_en_curso";
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

  if (ESTADOS_EN_CURSO.includes(pago.status)) {
    return registrarPagoEnCurso(pedidoId, idPago);
  }

  // cualquier otro estado (devuelto, contracargo...) no cambia el pedido
  return "ignorado";
}

module.exports = { procesarPagoService, leerReferencia };
