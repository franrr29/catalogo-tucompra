const { Payment } = require("mercadopago");
const mp = require("../config/mercadoPago");
const baseDatos = require("../config/db");

// verifico si fue exitoso el pago de mercadopago

async function procesarPagoService(pagoId) {
  const pago = await new Payment(mp).get({ id: pagoId });
  const pedidoId = pago.external_reference;

  if (pago.status === "approved") {
    // actualizo en base de datos
    await baseDatos.query(
      "UPDATE pedidos SET estado = 'pagado', mercadopago_id = ? WHERE id = ?",
      [String(pagoId), pedidoId]
    );
    return;
  }

  // si se rechaza o cancela, libero el stock reservado
  if (pago.status === "rejected" || pago.status === "cancelled") {
    const conexion = await baseDatos.getConnection();

    try {
      await conexion.beginTransaction();

      // evito restaurar el stock dos veces si llega la notificacion repetida
      const [pedidos] = await conexion.query(
        "SELECT estado FROM pedidos WHERE id = ? FOR UPDATE",
        [pedidoId]
      );

      if (pedidos.length === 0 || pedidos[0].estado !== "pendiente") {
        await conexion.rollback();
        return;
      }

      const [items] = await conexion.query(
        "SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = ?",
        [pedidoId]
      );

      for (const item of items) {
        await conexion.query(
          "UPDATE productos SET stock = stock + ? WHERE id = ?",
          [item.cantidad, item.producto_id]
        );
      }

      await conexion.query(
        "UPDATE pedidos SET estado = 'cancelado', mercadopago_id = ? WHERE id = ?",
        [String(pagoId), pedidoId]
      );

      await conexion.commit();
    } catch (error) {
      await conexion.rollback();
      throw error;
    } finally {
      conexion.release();
    }
  }
}

module.exports = { procesarPagoService };
