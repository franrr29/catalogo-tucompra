process.env.MP_ACCESS_TOKEN = "test-token";

// mockeo la base de datos y mercado pago: ningun test toca la base real ni llama a mercado pago
jest.mock("../config/db", () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

jest.mock("../config/mercadoPago.js", () => ({}));

const mockCrearPreferencia = jest.fn();
jest.mock("mercadopago", () => ({
  Preference: jest.fn().mockImplementation(() => ({ create: mockCrearPreferencia })),
}));

const express = require("express");
const request = require("supertest");
const baseDatos = require("../config/db");
const pedidosRoutes = require("./pedidos.routes");

const app = express();
app.use(express.json());
app.use("/api/pedidos", pedidosRoutes);

const PEDIDO_VALIDO = {
  nombre: "Juan Perez",
  email: "juan@mail.com",
  telefono: "099 123 456",
  items: [{ productoId: 1, cantidad: 2 }],
  envio: {
    tipoEntrega: "domicilio",
    cedula: "1.234.567-8",
    departamento: "Montevideo",
    ciudad: "Pocitos",
    direccion: "Calle Falsa 123 apto 4",
    comentario: "casa con rejas",
  },
};

let conexion;

beforeEach(() => {
  jest.clearAllMocks();
  conexion = {
    beginTransaction: jest.fn().mockResolvedValue(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    release: jest.fn(),
    query: jest
      .fn()
      .mockResolvedValueOnce([{ insertId: 55 }]) // INSERT pedidos
      .mockResolvedValueOnce([{}]) // INSERT pedido_items
      .mockResolvedValue([{ affectedRows: 1 }]), // UPDATE stock
  };
  baseDatos.getConnection.mockResolvedValue(conexion);
  baseDatos.query.mockResolvedValue([[{ id: 1, nombre: "G-Shock", precio: "100.00", stock: 10 }]]);
  mockCrearPreferencia.mockResolvedValue({ init_point: "https://mp.test/pagar" });
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
  console.log.mockRestore();
});

function textoDeLogs() {
  return JSON.stringify([...console.error.mock.calls, ...console.log.mock.calls]);
}

describe("guardado de los datos de envio", () => {
  test("guarda los datos normalizados en el INSERT del pedido, dentro de la transaccion", async () => {
    const respuesta = await request(app).post("/api/pedidos").send(PEDIDO_VALIDO);

    expect(respuesta.status).toBe(200);
    expect(conexion.beginTransaction).toHaveBeenCalledTimes(1);

    const [sql, valores] = conexion.query.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO pedidos/);
    expect(sql).toMatch(/tipo_entrega, cedula, departamento, ciudad, direccion, agencia, comentario/);
    expect(valores).toEqual([
      "Juan Perez",
      "juan@mail.com",
      "099123456",
      200, // el total lo calcula el backend con el precio de la base
      "domicilio",
      "12345678",
      "Montevideo",
      "Pocitos",
      "Calle Falsa 123 apto 4",
      null,
      "casa con rejas",
    ]);
    expect(conexion.commit).toHaveBeenCalledTimes(1);
    expect(conexion.rollback).not.toHaveBeenCalled();
    expect(conexion.release).toHaveBeenCalledTimes(1);
  });

  test("el descuento de stock y la preferencia de mercado pago siguen funcionando", async () => {
    const respuesta = await request(app).post("/api/pedidos").send(PEDIDO_VALIDO);

    const sqls = conexion.query.mock.calls.map(([sql]) => sql);
    expect(sqls.some((sql) => /UPDATE productos SET stock = stock - \?/.test(sql))).toBe(true);
    expect(mockCrearPreferencia).toHaveBeenCalledTimes(1);
    expect(respuesta.body.pedido).toEqual({ id: 55, total: 200, init_point: "https://mp.test/pagar" });
  });

  test("retiro en agencia: guarda la agencia y deja la direccion en null", async () => {
    await request(app)
      .post("/api/pedidos")
      .send({
        ...PEDIDO_VALIDO,
        envio: { tipoEntrega: "agencia", departamento: "Salto", ciudad: "Salto", agencia: "DAC centro" },
      });

    const valores = conexion.query.mock.calls[0][1];
    expect(valores.slice(4)).toEqual(["agencia", null, "Salto", "Salto", null, "DAC centro", null]);
  });

  test("sin stock suficiente: rollback, no se guarda el pedido y no se llama a mercado pago", async () => {
    conexion.query = jest
      .fn()
      .mockResolvedValueOnce([{ insertId: 55 }])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{ affectedRows: 0 }]);

    const respuesta = await request(app).post("/api/pedidos").send(PEDIDO_VALIDO);

    expect(respuesta.status).toBe(400);
    expect(conexion.rollback).toHaveBeenCalledTimes(1);
    expect(conexion.commit).not.toHaveBeenCalled();
    expect(mockCrearPreferencia).not.toHaveBeenCalled();
  });
});

describe("validacion (400 antes de tocar la base o mercado pago)", () => {
  const casos = [
    ["sin datos de envio", { envio: undefined }, "envio"],
    ["departamento invalido", { envio: { ...PEDIDO_VALIDO.envio, departamento: "Atlantida" } }, "departamento"],
    ["domicilio sin direccion", { envio: { ...PEDIDO_VALIDO.envio, direccion: "" } }, "direccion"],
    ["comentario de 301 caracteres", { envio: { ...PEDIDO_VALIDO.envio, comentario: "a".repeat(301) } }, "comentario"],
    ["cedula mal formada", { envio: { ...PEDIDO_VALIDO.envio, cedula: "12" } }, "cedula"],
    ["telefono invalido", { telefono: "123" }, "telefono"],
    ["email invalido", { email: "juan" }, "email"],
  ];

  test.each(casos)("%s: 400 con mensaje y campo", async (_, cambios, campo) => {
    const respuesta = await request(app).post("/api/pedidos").send({ ...PEDIDO_VALIDO, ...cambios });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.campo).toBe(campo);
    expect(typeof respuesta.body.mensaje).toBe("string");
    expect(baseDatos.query).not.toHaveBeenCalled();
    expect(baseDatos.getConnection).not.toHaveBeenCalled();
    expect(mockCrearPreferencia).not.toHaveBeenCalled();
  });

  test("sin items o con items vacios: 400", async () => {
    const sinItems = await request(app).post("/api/pedidos").send({ ...PEDIDO_VALIDO, items: undefined });
    const vacios = await request(app).post("/api/pedidos").send({ ...PEDIDO_VALIDO, items: [] });

    expect(sinItems.status).toBe(400);
    expect(vacios.status).toBe(400);
  });

  const itemsInvalidos = [
    ["un item null", [null]],
    ["un item que no es objeto", ["1"]],
    ["un item sin productoId", [{ cantidad: 1 }]],
    ["productoId como texto", [{ productoId: "1", cantidad: 1 }]],
    ["productoId cero", [{ productoId: 0, cantidad: 1 }]],
    ["productoId negativo", [{ productoId: -3, cantidad: 1 }]],
    ["productoId decimal", [{ productoId: 1.5, cantidad: 1 }]],
    ["cantidad como texto", [{ productoId: 1, cantidad: "2" }]],
    ["cantidad cero", [{ productoId: 1, cantidad: 0 }]],
    ["cantidad decimal", [{ productoId: 1, cantidad: 1.5 }]],
    ["cantidad enorme (no es entero seguro)", [{ productoId: 1, cantidad: 1e21 }]],
    ["productos repetidos", [{ productoId: 1, cantidad: 1 }, { productoId: 1, cantidad: 2 }]],
    ["items que no es un array", { productoId: 1, cantidad: 1 }],
  ];

  test.each(itemsInvalidos)("%s: 400 con campo items y sin tocar la base", async (_, items) => {
    const respuesta = await request(app).post("/api/pedidos").send({ ...PEDIDO_VALIDO, items });

    expect(respuesta.status).toBe(400);
    expect(typeof respuesta.body.mensaje).toBe("string");
    expect(baseDatos.query).not.toHaveBeenCalled();
    expect(baseDatos.getConnection).not.toHaveBeenCalled();
    expect(mockCrearPreferencia).not.toHaveBeenCalled();
  });

  test("un item mal formado nunca produce un 500", async () => {
    for (const [, items] of itemsInvalidos) {
      const respuesta = await request(app).post("/api/pedidos").send({ ...PEDIDO_VALIDO, items });
      expect(respuesta.status).toBe(400);
    }
  });

  test("una peticion sin body responde 400 y no 500", async () => {
    const respuesta = await request(app).post("/api/pedidos");
    expect(respuesta.status).toBe(400);
  });
});

describe("errores inesperados y datos personales", () => {
  test("un fallo interno responde un 500 generico, sin el mensaje interno", async () => {
    baseDatos.getConnection.mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.5:3306"));

    const respuesta = await request(app).post("/api/pedidos").send(PEDIDO_VALIDO);

    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({ mensaje: "error interno del servidor" });
  });

  test("un fallo interno no escribe datos personales en los logs", async () => {
    baseDatos.getConnection.mockRejectedValue(new Error("fallo de conexion"));

    await request(app).post("/api/pedidos").send(PEDIDO_VALIDO);

    expect(console.error).toHaveBeenCalled();
    const logs = textoDeLogs();
    for (const dato of ["Calle Falsa", "12345678", "1.234.567-8", "juan@mail.com", "099123456", "Juan Perez", "casa con rejas"]) {
      expect(logs).not.toContain(dato);
    }
  });

  test("la respuesta del pedido creado no devuelve datos personales", async () => {
    const respuesta = await request(app).post("/api/pedidos").send(PEDIDO_VALIDO);

    const texto = JSON.stringify(respuesta.body);
    for (const dato of ["Calle Falsa", "12345678", "juan@mail.com", "099123456", "Juan Perez", "casa con rejas"]) {
      expect(texto).not.toContain(dato);
    }
  });
});
