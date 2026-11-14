const baseDatos = require("../config/db");
const crearError = require("../utils/crearError");

// reportes agregados para el panel: nunca devuelven nombres, telefonos, cedulas ni direcciones de clientes.
// solo cuentan pedidos PAGADOS. el filtro de fecha usa pedidos.fecha (la fecha de creacion del pedido):
// no existe una fecha de pago, asi que un pedido pagado dias despues cuenta en el dia en que se creo

const PERIODOS = ["mes", "30dias", "todo"];
const ORDENES = { unidades: "unidades DESC, ingresos DESC", ingresos: "ingresos DESC, unidades DESC" };
const LIMITE_POR_DEFECTO = 10;
const LIMITE_MAXIMO = 50;

// Uruguay no usa horario de verano: su hora local es siempre UTC-3
const DESFASE_URUGUAY_MS = 3 * 60 * 60 * 1000;
// pedidos.fecha es un DATETIME sin zona que MySQL llena con CURRENT_TIMESTAMP en UTC (el servidor corre en UTC)
// y el pool de mysql2 no define la opcion timezone. por eso los limites se mandan como strings
// 'YYYY-MM-DD HH:MM:SS' ya convertidos a UTC y nunca como objetos Date: mysql2 serializa los Date segun la zona
// del proceso, y la PC de desarrollo (America/Montevideo) y Render (UTC) darian resultados distintos
function comoFechaSql(milisegundos) {
  return new Date(milisegundos).toISOString().slice(0, 19).replace("T", " ");
}

// limite inferior del periodo como string de fecha SQL en UTC, o null si no hay limite ("todo").
// "este mes" empieza el dia 1 a las 00:00 hora de Uruguay; "30 dias" son los 30 dias anteriores a ahora.
// solo usa getters UTC, asi que no depende de la zona del proceso
function periodoADesde(periodo, ahora = Date.now()) {
  if (periodo === "todo") return null;
  if (periodo === "30dias") return comoFechaSql(ahora - 30 * 24 * 60 * 60 * 1000);

  // "mes": el mes se calcula en hora de Uruguay y luego se pasa a UTC
  const enUruguay = new Date(ahora - DESFASE_URUGUAY_MS);
  const inicioMesUruguayComoUtc = Date.UTC(enUruguay.getUTCFullYear(), enUruguay.getUTCMonth(), 1);
  return comoFechaSql(inicioMesUruguayComoUtc + DESFASE_URUGUAY_MS);
}

function leerPeriodo(periodo) {
  if (periodo === undefined || periodo === "") return "mes";
  if (typeof periodo !== "string" || !PERIODOS.includes(periodo)) {
    throw crearError(`periodo invalido: debe ser ${PERIODOS.join(", ")}`, 400);
  }
  return periodo;
}

function leerOrden(orden) {
  if (orden === undefined || orden === "") return "unidades";
  if (typeof orden !== "string" || !Object.prototype.hasOwnProperty.call(ORDENES, orden)) {
    throw crearError("orden invalido: debe ser unidades o ingresos", 400);
  }
  return orden;
}

function leerLimite(limite) {
  if (limite === undefined || limite === "") return LIMITE_POR_DEFECTO;
  if (typeof limite !== "string" || !/^\d+$/.test(limite)) {
    throw crearError("limite invalido", 400);
  }
  const numero = Number(limite);
  if (!Number.isSafeInteger(numero) || numero < 1 || numero > LIMITE_MAXIMO) {
    throw crearError(`limite invalido: debe estar entre 1 y ${LIMITE_MAXIMO}`, 400);
  }
  return numero;
}

// condicion de fecha parametrizada: el string de fecha viaja como parametro, nunca dentro del SQL
function condicionFecha(desde) {
  return desde ? { sql: " AND p.fecha >= ?", params: [desde] } : { sql: "", params: [] };
}

const aDinero = (valor) => Math.round(Number(valor || 0) * 100) / 100;
const aPorcentaje = (valor) => Math.round(valor * 10) / 10;

async function masVendidosService({ periodo, orden, limite } = {}, ahora = Date.now()) {
  const periodoLeido = leerPeriodo(periodo);
  const ordenLeido = leerOrden(orden);
  const limiteLeido = leerLimite(limite);
  const fecha = condicionFecha(periodoADesde(periodoLeido, ahora));

  const [filas] = await baseDatos.query(
    `SELECT pi.producto_id AS producto_id, pr.nombre AS nombre, pr.activo AS activo,
            SUM(pi.cantidad) AS unidades, SUM(pi.cantidad * pi.precio_unitario) AS ingresos
     FROM pedido_items pi
     JOIN pedidos p ON p.id = pi.pedido_id
     JOIN productos pr ON pr.id = pi.producto_id
     WHERE p.estado = 'pagado'${fecha.sql}
     GROUP BY pi.producto_id, pr.nombre, pr.activo
     ORDER BY ${ORDENES[ordenLeido]}, pr.nombre ASC, pi.producto_id ASC
     LIMIT ?`,
    [...fecha.params, limiteLeido]
  );

  return {
    periodo: periodoLeido,
    orden: ordenLeido,
    productos: filas.map((fila) => ({
      productoId: fila.producto_id,
      nombre: fila.nombre,
      activo: Boolean(fila.activo),
      unidades: Number(fila.unidades),
      ingresos: aDinero(fila.ingresos),
    })),
  };
}

// pedidos e ingresos por departamento; solo pedidos pagados con datos de envio
async function ventasPorDepartamentoService({ periodo } = {}, ahora = Date.now()) {
  const periodoLeido = leerPeriodo(periodo);
  const fecha = condicionFecha(periodoADesde(periodoLeido, ahora));

  const [filas] = await baseDatos.query(
    `SELECT p.departamento AS departamento, COUNT(*) AS pedidos, SUM(p.total) AS ingresos
     FROM pedidos p
     WHERE p.estado = 'pagado' AND p.tipo_entrega IS NOT NULL AND p.departamento IS NOT NULL${fecha.sql}
     GROUP BY p.departamento
     ORDER BY ingresos DESC, p.departamento ASC`,
    fecha.params
  );

  return {
    periodo: periodoLeido,
    departamentos: filas.map((fila) => ({
      departamento: fila.departamento,
      pedidos: Number(fila.pedidos),
      ingresos: aDinero(fila.ingresos),
    })),
  };
}

// ingresos, costo y ganancia del periodo. el margen se calcula SOLO con las lineas que tienen costo_unitario:
// las lineas sin costo (pedidos anteriores a esta funcion o productos sin costo cargado) no se asumen en 0,
// quedan fuera del margen y se informan como ingresosSinCosto. productosSinCosto lista los activos sin costo
async function margenService({ periodo } = {}, ahora = Date.now()) {
  const periodoLeido = leerPeriodo(periodo);
  const fecha = condicionFecha(periodoADesde(periodoLeido, ahora));

  const [[totales]] = await baseDatos.query(
    `SELECT COALESCE(SUM(pi.cantidad * pi.precio_unitario), 0) AS ingresos_totales,
            COALESCE(SUM(CASE WHEN pi.costo_unitario IS NOT NULL THEN pi.cantidad * pi.precio_unitario END), 0) AS ingresos_con_costo,
            COALESCE(SUM(CASE WHEN pi.costo_unitario IS NOT NULL THEN pi.cantidad * pi.costo_unitario END), 0) AS costo
     FROM pedido_items pi
     JOIN pedidos p ON p.id = pi.pedido_id
     WHERE p.estado = 'pagado'${fecha.sql}`,
    fecha.params
  );

  const [sinCosto] = await baseDatos.query(
    "SELECT id, nombre FROM productos WHERE activo = 1 AND costo IS NULL ORDER BY nombre ASC, id ASC"
  );

  const ingresosTotales = aDinero(totales.ingresos_totales);
  const ingresosConCosto = aDinero(totales.ingresos_con_costo);
  const costo = aDinero(totales.costo);
  const ganancia = aDinero(ingresosConCosto - costo);

  return {
    periodo: periodoLeido,
    ingresosTotales,
    ingresosConCosto,
    ingresosSinCosto: aDinero(ingresosTotales - ingresosConCosto),
    costo,
    ganancia,
    // null = no hay ventas con costo para calcularlo (sin dato, no 0)
    margenPct: ingresosConCosto > 0 ? aPorcentaje((ganancia / ingresosConCosto) * 100) : null,
    // que parte de los ingresos tiene costo; null si no hubo ventas
    coberturaPct: ingresosTotales > 0 ? aPorcentaje((ingresosConCosto / ingresosTotales) * 100) : null,
    productosSinCosto: sinCosto.map((fila) => ({ id: fila.id, nombre: fila.nombre })),
  };
}

module.exports = {
  masVendidosService,
  ventasPorDepartamentoService,
  margenService,
  periodoADesde,
};
