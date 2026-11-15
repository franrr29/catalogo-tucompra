process.env.MP_ACCESS_TOKEN = "test-token";

// mockeo la base y mercado pago: ningun test toca la base real ni llama a mercado pago
jest.mock("../config/db", () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));
jest.mock("../config/mercadoPago", () => ({}));

const mockObtenerPago = jest.fn();
jest.mock("mercadopago", () => ({
  Payment: jest.fn().mockImplementation(() => ({ get: mockObtenerPago })),
}));

const baseDatos = require("../config/db");
const { procesarPagoService, leerReferencia } = require("./webhook.service");

// estado de la "base" simulada: un pedido y los items que tiene
let pedido;
let items;
// stock disponible por producto en la base simulada
let stock;
let conexion;

function pagoDeMp(cambios = {}) {
  return { id: 9001, status: "approved", external_reference: "7", transaction_amount: 300, ...cambios };
}

beforeEach(() => {
  jest.clearAllMocks();
  pedido = { estado: "pendiente", total: "300.00", mercadopago_id: null };
  items = [{ producto_id: 2, cantidad: 1 }, { producto_id: 5, cantidad: 2 }];
  stock = { 2: 10, 5: 10 };

  conexion = {
    beginTransaction: jest.fn().mockResolvedValue(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    release: jest.fn(),
    query: jest.fn(async (sql, params) => {
      if (/FROM pedidos WHERE id = \? FOR UPDATE/.test(sql)) return [pedido ? [pedido] : []];
      if (/FROM pedido_items/.test(sql)) return [items];
      if (/SET stock = stock - ?/.test(sql)) {
        const [cantidad, productoId] = params;
        if (stock[productoId] < cantidad) return [{ affectedRows: 0 }];
        stock[productoId] -= cantidad;
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 1 }];
    }),
  };
  baseDatos.getConnection.mockResolvedValue(conexion);
  mockObtenerPago.mockResolvedValue(pagoDeMp());
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

const escrituras = () =>
  conexion.query.mock.calls.map(([sql, params]) => ({ sql: sql.replace(/\s+/g, " ").trim(), params })).filter(({ sql }) => /^UPDATE/.test(sql));
const logs = () => JSON.stringify(console.error.mock.calls);

describe("leerReferencia", () => {
  test.each([
    ["7", 7],
    [" 12 ", 12],
    [55, 55],
    ["2147483647", 2147483647],
  ])("acepta %p", (valor, esperado) => expect(leerReferencia(valor)).toBe(esperado));

  test.each([[undefined], [null], [""], ["abc"], ["0"], ["-3"], ["1.5"], ["2147483648"], ["12345678901"], ["1 OR 1=1"], [{}], [[7]]])(
    "rechaza %p",
    (valor) => expect(leerReferencia(valor)).toBeNull()
  );
});

describe("pago aprobado", () => {
  test("pedido pendiente con el monto correcto: pasa a pagado una sola vez, con el id del pago", async () => {
    expect(await procesarPagoService("9001")).toBe("pagado");

    expect(conexion.commit).toHaveBeenCalledTimes(1);
    expect(conexion.rollback).not.toHaveBeenCalled();
    expect(conexion.release).toHaveBeenCalledTimes(1);
    expect(escrituras()).toEqual([
      {
        sql: "UPDATE pedidos SET estado = 'pagado', mercadopago_id = ? WHERE id = ? AND estado = 'pendiente'",
        params: ["9001", 7],
      },
    ]);
  });

  test("usa los datos del pago consultado a mercado pago, no lo que diga el webhook", async () => {
    mockObtenerPago.mockResolvedValue(pagoDeMp({ external_reference: "42" }));
    await procesarPagoService("9001");
    expect(escrituras()[0].params).toEqual(["9001", 42]);
    expect(mockObtenerPago).toHaveBeenCalledWith({ id: "9001" });
  });

  test("evento duplicado de un pedido ya pagado con el mismo pago: no escribe nada", async () => {
    pedido = { estado: "pagado", total: "300.00", mercadopago_id: "9001" };

    expect(await procesarPagoService("9001")).toBe("ya_pagado");
    expect(escrituras()).toEqual([]);
    expect(console.error).not.toHaveBeenCalled();
  });

  test("otro pago aprobado para un pedido ya pagado: no cambia nada y deja log para reembolso manual", async () => {
    pedido = { estado: "pagado", total: "300.00", mercadopago_id: "1111" };

    expect(await procesarPagoService("9001")).toBe("ya_pagado");
    expect(escrituras()).toEqual([]);
    expect(logs()).toContain("PAGO_DUPLICADO_REEMBOLSO_MANUAL");
    expect(logs()).toContain("9001");
    expect(logs()).toContain("1111");
  });

  test.each([
    ["menor", 299.99],
    ["mayor", 300.01],
    ["undefined", undefined],
    ["texto no numerico", "abc"],
  ])("monto %s al del pedido: no se marca pagado y queda log para revisar", async (_, monto) => {
    mockObtenerPago.mockResolvedValue(pagoDeMp({ transaction_amount: monto }));

    expect(await procesarPagoService("9001")).toBe("monto_distinto");
    expect(escrituras()).toEqual([]);
    expect(logs()).toContain("PAGO_MONTO_DISTINTO_REVISAR");
  });

  test("compara en centavos: 100.10 y '100.10' coinciden sin errores de coma flotante", async () => {
    pedido = { estado: "pendiente", total: "100.10", mercadopago_id: null };
    mockObtenerPago.mockResolvedValue(pagoDeMp({ transaction_amount: 100.1 }));

    expect(await procesarPagoService("9001")).toBe("pagado");
  });

  test("referencia que no es un id valido: se ignora sin tocar la base", async () => {
    mockObtenerPago.mockResolvedValue(pagoDeMp({ external_reference: "no-es-un-id" }));

    expect(await procesarPagoService("9001")).toBe("ignorado");
    expect(baseDatos.getConnection).not.toHaveBeenCalled();
    expect(logs()).toContain("PAGO_SIN_REFERENCIA_VALIDA");
  });

  test("pedido inexistente: se ignora con log y sin escribir", async () => {
    pedido = null;

    expect(await procesarPagoService("9001")).toBe("ignorado");
    expect(escrituras()).toEqual([]);
    expect(logs()).toContain("PEDIDO_INEXISTENTE");
  });
});

describe("approved tardio sobre un pedido cancelado", () => {
  beforeEach(() => {
    pedido = { estado: "cancelado", total: "300.00", mercadopago_id: null };
  });

  test("con stock suficiente: lo vuelve a reservar y marca pagado, todo en una transaccion", async () => {
    expect(await procesarPagoService("9001")).toBe("pagado_tras_cancelacion");

    expect(stock).toEqual({ 2: 9, 5: 8 });
    expect(conexion.beginTransaction).toHaveBeenCalledTimes(1);
    expect(conexion.commit).toHaveBeenCalledTimes(1);
    expect(conexion.rollback).not.toHaveBeenCalled();
    const sql = escrituras();
    expect(sql.at(-1)).toEqual({
      sql: "UPDATE pedidos SET estado = 'pagado', mercadopago_id = ? WHERE id = ? AND estado = 'cancelado'",
      params: ["9001", 7],
    });
  });

  test("reserva los productos en orden de id para evitar deadlocks", async () => {
    items = [{ producto_id: 5, cantidad: 2 }, { producto_id: 2, cantidad: 1 }];
    await procesarPagoService("9001");

    const consultaItems = conexion.query.mock.calls.find(([sql]) => /FROM pedido_items/.test(sql))[0];
    expect(consultaItems).toMatch(/ORDER BY producto_id/);
  });

  test("sin stock en algun producto: rollback total (no queda ningun descuento), no se marca pagado y queda log para reembolso manual", async () => {
    stock = { 2: 10, 5: 1 }; // el segundo producto no alcanza (necesita 2)

    expect(await procesarPagoService("9001")).toBe("sin_stock");

    expect(conexion.rollback).toHaveBeenCalledTimes(1);
    expect(conexion.commit).not.toHaveBeenCalled();
    expect(conexion.query.mock.calls.some(([sql]) => /SET estado = 'pagado'/.test(sql))).toBe(false);
    expect(logs()).toContain("PAGO_APROBADO_SIN_STOCK_REEMBOLSO_MANUAL");
    expect(logs()).toContain("9001");
    const [, datos] = console.error.mock.calls.find(([evento]) => /REEMBOLSO_MANUAL/.test(evento));
    expect(JSON.parse(datos)).toEqual({ pedidoId: 7, pagoId: "9001", productoId: 5 });
  });

  test("sin stock: guarda el id del pago en el pedido cancelado para verlo en el panel", async () => {
    stock = { 2: 0, 5: 10 };
    await procesarPagoService("9001");

    expect(baseDatos.query).toHaveBeenCalledWith(
      "UPDATE pedidos SET mercadopago_id = ? WHERE id = ? AND estado = 'cancelado'",
      ["9001", 7]
    );
  });

  test("sin stock y la base falla al guardar el id: no lanza, lo registra", async () => {
    stock = { 2: 0, 5: 10 };
    baseDatos.query.mockRejectedValue(Object.assign(new Error("caida"), { code: "ECONNRESET" }));

    await expect(procesarPagoService("9001")).resolves.toBe("sin_stock");
    expect(logs()).toContain("NO_SE_PUDO_GUARDAR_EL_PAGO_HUERFANO");
  });

  test("sin stock: el log lleva ids pero ningun dato personal", async () => {
    stock = { 2: 0, 5: 10 };
    pedido.nombre = "Juan Perez";
    pedido.email = "juan@mail.com";
    await procesarPagoService("9001");
    expect(logs()).not.toMatch(/Juan|juan@|telefono|direccion/i);
  });

  test("con el monto distinto no reserva stock ni marca pagado", async () => {
    mockObtenerPago.mockResolvedValue(pagoDeMp({ transaction_amount: 10 }));

    expect(await procesarPagoService("9001")).toBe("monto_distinto");
    expect(stock).toEqual({ 2: 10, 5: 10 });
    expect(escrituras()).toEqual([]);
  });

  test("evento duplicado tras recuperar el pedido: ya esta pagado, no vuelve a descontar stock", async () => {
    await procesarPagoService("9001");
    pedido = { estado: "pagado", total: "300.00", mercadopago_id: "9001" };
    await procesarPagoService("9001");

    expect(stock).toEqual({ 2: 9, 5: 8 });
  });

  test("un error de la base durante la re-reserva hace rollback y se propaga (para que MP reintente)", async () => {
    const fallo = Object.assign(new Error("deadlock"), { code: "ER_LOCK_DEADLOCK" });
    conexion.query.mockImplementation(async (sql) => {
      if (/FOR UPDATE/.test(sql)) return [[pedido]];
      if (/FROM pedido_items/.test(sql)) return [items];
      throw fallo;
    });

    await expect(procesarPagoService("9001")).rejects.toBe(fallo);
    expect(conexion.rollback).toHaveBeenCalledTimes(1);
    expect(conexion.release).toHaveBeenCalledTimes(1);
  });
});

describe("pago rechazado o cancelado", () => {
  test.each(["rejected", "cancelled"])("%s sobre un pedido pendiente: devuelve el stock y cancela", async (status) => {
    mockObtenerPago.mockResolvedValue(pagoDeMp({ status }));

    expect(await procesarPagoService("9001")).toBe("cancelado");

    const sql = escrituras();
    expect(sql.slice(0, 2).map(({ params }) => params)).toEqual([[1, 2], [2, 5]]);
    expect(sql[2].sql).toBe("UPDATE pedidos SET estado = 'cancelado', mercadopago_id = ? WHERE id = ? AND estado = 'pendiente'");
    expect(sql[2].params).toEqual(["9001", 7]);
  });

  test.each(["pagado", "cancelado"])("sobre un pedido %s: no toca nada (idempotente)", async (estado) => {
    pedido = { estado, total: "300.00", mercadopago_id: "9001" };
    mockObtenerPago.mockResolvedValue(pagoDeMp({ status: "rejected" }));

    expect(await procesarPagoService("9001")).toBe("ignorado");
    expect(escrituras()).toEqual([]);
  });

  test("un rechazo tardio nunca baja un pedido pagado", async () => {
    pedido = { estado: "pagado", total: "300.00", mercadopago_id: "9001" };
    mockObtenerPago.mockResolvedValue(pagoDeMp({ id: 9002, status: "cancelled" }));

    await procesarPagoService("9002");
    expect(escrituras()).toEqual([]);
  });
});

describe("pago en curso (pago offline o en revision)", () => {
  test.each(["pending", "in_process", "in_mediation", "authorized"])("%s sobre un pedido pendiente: guarda el id del pago y no cambia el estado", async (status) => {
    mockObtenerPago.mockResolvedValue(pagoDeMp({ status }));

    expect(await procesarPagoService("9001")).toBe("pago_en_curso");

    expect(escrituras()).toEqual([
      { sql: "UPDATE pedidos SET mercadopago_id = ? WHERE id = ? AND estado = 'pendiente'", params: ["9001", 7] },
    ]);
  });

  test.each(["pagado", "cancelado"])("sobre un pedido %s: no escribe nada", async (estado) => {
    pedido = { estado, total: "300.00", mercadopago_id: null };
    mockObtenerPago.mockResolvedValue(pagoDeMp({ status: "pending" }));

    expect(await procesarPagoService("9001")).toBe("ignorado");
    expect(escrituras()).toEqual([]);
  });

  test("pendiente seguido de aprobado: el pedido termina pagado con el id del pago", async () => {
    mockObtenerPago.mockResolvedValueOnce(pagoDeMp({ status: "pending" }));
    await procesarPagoService("9001");
    pedido = { estado: "pendiente", total: "300.00", mercadopago_id: "9001" };

    mockObtenerPago.mockResolvedValueOnce(pagoDeMp({ status: "approved" }));
    expect(await procesarPagoService("9001")).toBe("pagado");
  });

  test("pendiente seguido de cancelado/vencido en mercado pago (mismo pago): se cancela y se libera el stock", async () => {
    pedido = { estado: "pendiente", total: "300.00", mercadopago_id: "9001" };
    mockObtenerPago.mockResolvedValue(pagoDeMp({ status: "cancelled" }));

    expect(await procesarPagoService("9001")).toBe("cancelado");
  });

  test("el rechazo de OTRO intento de pago no cancela un pedido con un pago offline en curso", async () => {
    pedido = { estado: "pendiente", total: "300.00", mercadopago_id: "9001" };
    mockObtenerPago.mockResolvedValue(pagoDeMp({ id: 9002, status: "rejected" }));

    expect(await procesarPagoService("9002")).toBe("ignorado_otro_pago_en_curso");
    expect(escrituras()).toEqual([]);
  });
});

describe("otros estados y errores", () => {
  test.each(["refunded", "charged_back"])("%s no cambia el pedido", async (status) => {
    mockObtenerPago.mockResolvedValue(pagoDeMp({ status }));

    expect(await procesarPagoService("9001")).toBe("ignorado");
    expect(escrituras()).toEqual([]);
  });

  test("si falla una consulta hace rollback, libera la conexion y propaga el error", async () => {
    const fallo = Object.assign(new Error("base caida"), { code: "ECONNRESET" });
    conexion.query.mockRejectedValue(fallo);

    await expect(procesarPagoService("9001")).rejects.toBe(fallo);
    expect(conexion.rollback).toHaveBeenCalledTimes(1);
    expect(conexion.commit).not.toHaveBeenCalled();
    expect(conexion.release).toHaveBeenCalledTimes(1);
  });

  test("los logs no llevan datos personales", async () => {
    pedido = { estado: "pagado", total: "300.00", mercadopago_id: "1111", nombre: "Juan Perez", email: "juan@mail.com" };
    await procesarPagoService("9001");
    expect(logs()).not.toMatch(/Juan|juan@|telefono|direccion/i);
  });
});
