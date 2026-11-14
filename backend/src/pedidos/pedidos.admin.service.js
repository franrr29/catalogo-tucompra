const baseDatos = require("../config/db");
const crearError = require("../utils/crearError");

const ESTADOS = ["pendiente", "pagado", "cancelado"];
const ESTADOS_ENVIO = ["por_despachar", "enviado", "entregado"];
const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 50;
const MAX_SEGUIMIENTO = 60;
const MAX_NUEVOS = 10;

// un pedido entra en Envios solo si esta pagado y tiene datos de envio (los pedidos viejos quedan afuera)
const CON_ENVIO = "estado = 'pagado' AND tipo_entrega IS NOT NULL";
// estado_envio null se interpreta como "por despachar": asi el webhook de pagos no necesita escribirlo
const POR_DESPACHAR = "(estado_envio IS NULL OR estado_envio = 'por_despachar')";

// estado de envio efectivo de una fila: null si el pedido no esta en Envios
function estadoEnvioDe(fila) {
  if (fila.estado !== "pagado" || !fila.tipo_entrega) return null;
  return fila.estado_envio || "por_despachar";
}

// convierte un parametro de la url a entero dentro de un rango; sin valor usa el por defecto
function leerEntero(valor, porDefecto, nombre, min, max) {
  if (valor === undefined || valor === "") return porDefecto;
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) {
    throw crearError(`${nombre} invalido`, 400);
  }
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero < min || numero > max) {
    throw crearError(`${nombre} invalido: debe estar entre ${min} y ${max}`, 400);
  }
  return numero;
}

function leerIdPedido(id) {
  const numero = Number(id);
  if (!/^\d+$/.test(String(id)) || !Number.isSafeInteger(numero) || numero <= 0) {
    throw crearError("id de pedido invalido", 400);
  }
  return numero;
}

// listado paginado para el panel: solo los datos necesarios para la tabla, sin cedula, direccion ni comentario
// estadoEnvio filtra los pedidos de Envios (pagados con envio) y no se combina con estado
async function listarPedidosService({ estado, estadoEnvio, pagina, limite }) {
  if (estado !== undefined && estado !== "todos" && !ESTADOS.includes(estado)) {
    throw crearError("estado invalido: usa pendiente, pagado, cancelado o todos", 400);
  }
  if (estadoEnvio !== undefined && !ESTADOS_ENVIO.includes(estadoEnvio)) {
    throw crearError("estadoEnvio invalido: usa por_despachar, enviado o entregado", 400);
  }
  if (estadoEnvio !== undefined && estado !== undefined) {
    throw crearError("no se pueden combinar estado y estadoEnvio", 400);
  }
  const paginaNum = leerEntero(pagina, 1, "pagina", 1, 1000000);
  const limiteNum = leerEntero(limite, LIMITE_POR_DEFECTO, "limite", 1, LIMITE_MAXIMO);

  // los filtros ya se validaron contra listas fijas y ademas viajan como parametro, nunca dentro del texto del sql
  let where = "";
  let parametrosWhere = [];
  if (estadoEnvio === "por_despachar") {
    where = `WHERE ${CON_ENVIO} AND ${POR_DESPACHAR}`;
  } else if (estadoEnvio !== undefined) {
    where = `WHERE ${CON_ENVIO} AND estado_envio = ?`;
    parametrosWhere = [estadoEnvio];
  } else if (estado !== undefined && estado !== "todos") {
    where = "WHERE estado = ?";
    parametrosWhere = [estado];
  }

  const [[conteo]] = await baseDatos.query(
    `SELECT COUNT(*) AS cantidad FROM pedidos ${where}`,
    parametrosWhere
  );
  const total = Number(conteo.cantidad);

  const [filas] = await baseDatos.query(
    `SELECT id, fecha, nombre, total, estado, tipo_entrega, departamento, ciudad, estado_envio, nro_seguimiento
     FROM pedidos ${where}
     ORDER BY fecha DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...parametrosWhere, limiteNum, (paginaNum - 1) * limiteNum]
  );

  return {
    pedidos: filas.map((fila) => ({
      id: fila.id,
      fecha: fila.fecha,
      nombre: fila.nombre,
      total: Number(fila.total),
      estado: fila.estado,
      tipoEntrega: fila.tipo_entrega,
      departamento: fila.departamento,
      ciudad: fila.ciudad,
      estadoEnvio: estadoEnvioDe(fila),
      nroSeguimiento: fila.nro_seguimiento,
    })),
    pagina: paginaNum,
    limite: limiteNum,
    total,
    totalPaginas: Math.ceil(total / limiteNum),
  };
}

// detalle completo de un pedido: contacto, envio, items y el id de mercado pago
async function obtenerPedidoAdminService(id) {
  const idNumerico = leerIdPedido(id);

  const [pedidos] = await baseDatos.query(
    `SELECT id, fecha, estado, total, mercadopago_id, nombre, email, telefono,
            tipo_entrega, cedula, departamento, ciudad, direccion, agencia, comentario,
            estado_envio, nro_seguimiento, enviado_en
     FROM pedidos WHERE id = ?`,
    [idNumerico]
  );

  if (pedidos.length === 0) {
    throw crearError("pedido no encontrado", 404);
  }

  const [items] = await baseDatos.query(
    `SELECT pi.producto_id, p.nombre, pi.cantidad, pi.precio_unitario
     FROM pedido_items pi
     JOIN productos p ON p.id = pi.producto_id
     WHERE pi.pedido_id = ?
     ORDER BY pi.id`,
    [idNumerico]
  );

  const pedido = pedidos[0];

  return {
    id: pedido.id,
    fecha: pedido.fecha,
    estado: pedido.estado,
    total: Number(pedido.total),
    mercadopagoId: pedido.mercadopago_id,
    cliente: {
      nombre: pedido.nombre,
      email: pedido.email,
      telefono: pedido.telefono,
    },
    // los pedidos anteriores a la funcion de envio no tienen estos datos
    envio: pedido.tipo_entrega
      ? {
          tipoEntrega: pedido.tipo_entrega,
          cedula: pedido.cedula,
          departamento: pedido.departamento,
          ciudad: pedido.ciudad,
          direccion: pedido.direccion,
          agencia: pedido.agencia,
          comentario: pedido.comentario,
          estadoEnvio: estadoEnvioDe(pedido),
          nroSeguimiento: pedido.nro_seguimiento,
          enviadoEn: pedido.enviado_en,
        }
      : null,
    items: items.map((item) => ({
      productoId: item.producto_id,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precioUnitario: Number(item.precio_unitario),
      subtotal: Math.round(Number(item.precio_unitario) * item.cantidad * 100) / 100,
    })),
  };
}

// cambia el estado de envio de un pedido. solo avanza o retrocede un paso (por despachar - enviado - entregado)
// o deja el estado como esta para corregir el numero de seguimiento
async function actualizarEnvioService(id, { estadoEnvio, nroSeguimiento }) {
  const idNumerico = leerIdPedido(id);

  if (!ESTADOS_ENVIO.includes(estadoEnvio)) {
    throw crearError("estadoEnvio invalido: usa por_despachar, enviado o entregado", 400);
  }

  // undefined deja el seguimiento como esta; vacio o null lo borra
  let seguimiento;
  if (nroSeguimiento === null) {
    seguimiento = null;
  } else if (nroSeguimiento !== undefined) {
    if (typeof nroSeguimiento !== "string") {
      throw crearError("nroSeguimiento invalido", 400);
    }
    // se quitan los caracteres de control y los espacios de los extremos
    seguimiento = nroSeguimiento.replace(/[\u0000-\u001f\u007f]/g, "").trim();
    if (seguimiento.length > MAX_SEGUIMIENTO) {
      throw crearError(`nroSeguimiento invalido: maximo ${MAX_SEGUIMIENTO} caracteres`, 400);
    }
    if (seguimiento === "") seguimiento = null;
  }

  const [filas] = await baseDatos.query(
    "SELECT id, estado, tipo_entrega, estado_envio FROM pedidos WHERE id = ?",
    [idNumerico]
  );
  if (filas.length === 0) {
    throw crearError("pedido no encontrado", 404);
  }

  const actual = estadoEnvioDe(filas[0]);
  if (actual === null) {
    throw crearError("solo se puede gestionar el envio de pedidos pagados con datos de envio", 409);
  }

  const salto = ESTADOS_ENVIO.indexOf(estadoEnvio) - ESTADOS_ENVIO.indexOf(actual);
  if (Math.abs(salto) > 1) {
    throw crearError(`no se puede pasar de ${actual} a ${estadoEnvio}: el cambio es de un paso a la vez`, 409);
  }

  const cambios = ["estado_envio = ?"];
  const parametros = [estadoEnvio];
  if (estadoEnvio === "enviado" && actual === "por_despachar") cambios.push("enviado_en = NOW()");
  if (estadoEnvio === "por_despachar") cambios.push("enviado_en = NULL");
  if (seguimiento !== undefined) {
    cambios.push("nro_seguimiento = ?");
    parametros.push(seguimiento);
  }

  // la condicion repite el estado que se leyo: si otro cambio se adelanto, no se pisa
  await baseDatos.query(
    `UPDATE pedidos SET ${cambios.join(", ")}
     WHERE id = ? AND ${CON_ENVIO}
       AND COALESCE(estado_envio, 'por_despachar') = ?`,
    [...parametros, idNumerico, actual]
  );

  const [despues] = await baseDatos.query(
    "SELECT id, estado, tipo_entrega, estado_envio, nro_seguimiento, enviado_en FROM pedidos WHERE id = ?",
    [idNumerico]
  );
  if (despues.length === 0 || estadoEnvioDe(despues[0]) !== estadoEnvio) {
    throw crearError("el pedido cambio mientras lo editabas: recarga y vuelve a intentarlo", 409);
  }

  return {
    id: despues[0].id,
    estadoEnvio,
    nroSeguimiento: despues[0].nro_seguimiento,
    enviadoEn: despues[0].enviado_en,
  };
}

// datos para la campanita: ventas pagadas con envio posteriores al id dado, mas el conteo de los por despachar
// sin desde no hay ventas "nuevas": solo devuelve ultimoId para que el panel fije su punto de partida
async function pedidosNuevosService({ desde }) {
  const desdeNum = leerEntero(desde, null, "desde", 0, Number.MAX_SAFE_INTEGER);

  const [[resumen]] = await baseDatos.query(
    `SELECT MAX(id) AS ultimo_id,
            COUNT(CASE WHEN ${POR_DESPACHAR} THEN 1 END) AS por_despachar,
            COUNT(CASE WHEN id > ? THEN 1 END) AS cantidad
     FROM pedidos WHERE ${CON_ENVIO}`,
    [desdeNum]
  );

  const cantidad = Number(resumen.cantidad);
  let ultimos = [];
  if (cantidad > 0) {
    const [filas] = await baseDatos.query(
      `SELECT id, fecha, nombre, total, ciudad
       FROM pedidos WHERE ${CON_ENVIO} AND id > ?
       ORDER BY id DESC LIMIT ?`,
      [desdeNum, MAX_NUEVOS]
    );
    ultimos = filas.map((fila) => ({
      id: fila.id,
      fecha: fila.fecha,
      nombre: fila.nombre,
      total: Number(fila.total),
      ciudad: fila.ciudad,
    }));
  }

  return {
    cantidad,
    ultimos,
    ultimoId: Number(resumen.ultimo_id) || 0,
    porDespachar: Number(resumen.por_despachar),
  };
}

module.exports = {
  listarPedidosService,
  obtenerPedidoAdminService,
  actualizarEnvioService,
  pedidosNuevosService,
  ESTADOS,
  ESTADOS_ENVIO,
};
