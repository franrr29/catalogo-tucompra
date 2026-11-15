// mockeo la base: ningun test toca la base real
jest.mock("../config/db", () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

const baseDatos = require("../config/db");
const {
  liberarPedidosVencidos,
  leerMinutosDeVencimiento,
  ventanaDeVencimiento,
  reiniciarLimitador,
  LOTE_MAXIMO,
} = require("./pedidos.vencimiento");

let conexion;
// pedido que devuelve el SELECT ... FOR UPDATE de cada candidato
let pedidoBloqueado;

beforeEach(() => {
  jest.clearAllMocks();
  reiniciarLimitador();
  delete process.env.PEDIDO_EXPIRA_MIN;
  pedidoBloqueado = { estado: "pendiente", mercadopago_id: null, vencido: 1 };

  conexion = {
    beginTransaction: jest.fn().mockResolvedValue(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    release: jest.fn(),
    query: jest.fn(async (sql) => {
      if (/FOR UPDATE/.test(sql)) return [[pedidoBloqueado]];
      if (/FROM pedido_items/.test(sql)) return [[{ producto_id: 3, cantidad: 2 }, { producto_id: 9, cantidad: 1 }]];
      return [{ affectedRows: 1 }];
    }),
  };
  baseDatos.getConnection.mockResolvedValue(conexion);
  baseDatos.query.mockResolvedValue([[{ id: 11 }]]);
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
  console.log.mockRestore();
});

const sentencias = () => conexion.query.mock.calls.map(([sql]) => sql.replace(/\s+/g, " ").trim());

describe("leerMinutosDeVencimiento", () => {
  test.each([
    [undefined, 60],
    ["", 60],
    ["   ", 60],
    ["abc", 60],
    ["-5", 60],
    ["0", 60],
    ["1.5", 60],
    ["1e3", 60],
    ["99999999999999999999", 60],
    ["30", 30],
    [" 120 ", 120],
    [45, 45],
  ])("%p -> %p", (valor, esperado) => {
    expect(leerMinutosDeVencimiento(valor)).toBe(esperado);
  });
});

describe("ventanaDeVencimiento", () => {
  test("devuelve los campos de mercado pago con offset y la duracion pedida", () => {
    const ventana = ventanaDeVencimiento(new Date("2026-03-01T12:00:00.000Z"), 45);

    expect(ventana).toEqual({
      expires: true,
      expiration_date_from: "2026-03-01T12:00:00.000+00:00",
      expiration_date_to: "2026-03-01T12:45:00.000+00:00",
    });
  });

  test("por defecto usa PEDIDO_EXPIRA_MIN", () => {
    process.env.PEDIDO_EXPIRA_MIN = "10";
    const ventana = ventanaDeVencimiento(new Date("2026-03-01T12:00:00.000Z"));
    expect(ventana.expiration_date_to).toBe("2026-03-01T12:10:00.000+00:00");
  });
});

describe("liberarPedidosVencidos", () => {
  test("cancela un pedido vencido y le devuelve el stock, en una transaccion", async () => {
    const cantidad = await liberarPedidosVencidos();

    expect(cantidad).toBe(1);
    expect(conexion.beginTransaction).toHaveBeenCalledTimes(1);
    expect(conexion.commit).toHaveBeenCalledTimes(1);
    expect(conexion.rollback).not.toHaveBeenCalled();
    expect(conexion.release).toHaveBeenCalledTimes(1);

    const stock = conexion.query.mock.calls.filter(([sql]) => /UPDATE productos SET stock = stock \+ \?/.test(sql));
    expect(stock.map(([, params]) => params)).toEqual([[2, 3], [1, 9]]);
    expect(
      sentencias().some((s) => /UPDATE pedidos SET estado = 'cancelado' WHERE id = \? AND estado = 'pendiente'/.test(s))
    ).toBe(true);
  });

  test("la busqueda solo trae pendientes SIN pago en curso, parametrizada y acotada", async () => {
    await liberarPedidosVencidos();

    const [sql, params] = baseDatos.query.mock.calls[0];
    expect(sql).toMatch(/estado = 'pendiente'/);
    expect(sql).toMatch(/mercadopago_id IS NULL/);
    expect(sql).toMatch(/INTERVAL \? MINUTE/);
    expect(params).toEqual([60, LOTE_MAXIMO]);
  });

  test("usa PEDIDO_EXPIRA_MIN", async () => {
    process.env.PEDIDO_EXPIRA_MIN = "15";
    await liberarPedidosVencidos();
    expect(baseDatos.query.mock.calls[0][1][0]).toBe(15);
  });

  test.each([
    ["ya esta pagado", { estado: "pagado", mercadopago_id: "555", vencido: 1 }],
    ["ya esta cancelado", { estado: "cancelado", mercadopago_id: null, vencido: 1 }],
    ["tiene un pago en curso (offline pendiente)", { estado: "pendiente", mercadopago_id: "777", vencido: 1 }],
    ["todavia no vencio", { estado: "pendiente", mercadopago_id: null, vencido: 0 }],
  ])("no toca un pedido que %s al bloquearlo", async (_, fila) => {
    pedidoBloqueado = fila;

    const cantidad = await liberarPedidosVencidos();

    expect(cantidad).toBe(0);
    expect(conexion.rollback).toHaveBeenCalledTimes(1);
    expect(conexion.commit).not.toHaveBeenCalled();
    expect(sentencias().some((s) => /^UPDATE/.test(s))).toBe(false);
  });

  test("si no hay candidatos no abre ninguna transaccion", async () => {
    baseDatos.query.mockResolvedValue([[]]);
    expect(await liberarPedidosVencidos()).toBe(0);
    expect(baseDatos.getConnection).not.toHaveBeenCalled();
  });

  test("un fallo en un pedido hace rollback, se registra y sigue con el resto", async () => {
    baseDatos.query.mockResolvedValue([[{ id: 11 }, { id: 12 }]]);
    const conexionRota = {
      ...conexion,
      beginTransaction: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn(),
      query: jest.fn().mockRejectedValue(Object.assign(new Error("deadlock"), { code: "ER_LOCK_DEADLOCK" })),
    };
    baseDatos.getConnection.mockResolvedValueOnce(conexionRota).mockResolvedValueOnce(conexion);

    const cantidad = await liberarPedidosVencidos();

    expect(cantidad).toBe(1);
    expect(conexionRota.rollback).toHaveBeenCalledTimes(1);
    expect(conexionRota.release).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
  });

  test("nunca lanza: si falla la busqueda lo registra y devuelve 0", async () => {
    baseDatos.query.mockRejectedValue(new Error("base caida"));
    await expect(liberarPedidosVencidos()).resolves.toBe(0);
    expect(console.error).toHaveBeenCalled();
  });

  test("limitador: una segunda llamada inmediata no vuelve a consultar, salvo que se fuerce", async () => {
    await liberarPedidosVencidos();
    await liberarPedidosVencidos();
    expect(baseDatos.query).toHaveBeenCalledTimes(1);

    await liberarPedidosVencidos({ forzar: true });
    expect(baseDatos.query).toHaveBeenCalledTimes(2);
  });

  test("los logs solo llevan ids, sin datos personales", async () => {
    await liberarPedidosVencidos();
    const texto = JSON.stringify([...console.log.mock.calls, ...console.error.mock.calls]);
    expect(texto).toContain("11");
    expect(texto).not.toMatch(/@|nombre|telefono|direccion/i);
  });
});
