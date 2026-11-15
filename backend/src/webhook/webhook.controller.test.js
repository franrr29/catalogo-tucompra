process.env.MP_ACCESS_TOKEN = "test-token";

// mockeo el servicio: aca solo se prueban los codigos de respuesta, sin base ni mercado pago
const mockProcesarPago = jest.fn();
jest.mock("./webhook.service", () => ({ procesarPagoService: (...args) => mockProcesarPago(...args) }));

const mockLiberarVencidos = jest.fn().mockResolvedValue(0);
jest.mock("../pedidos/pedidos.vencimiento", () => ({ liberarPedidosVencidos: (...args) => mockLiberarVencidos(...args) }));

const express = require("express");
const request = require("supertest");
const webhookRoutes = require("./webhook.routes");

const app = express();
app.use(express.json());
app.use("/api/pedidos", webhookRoutes);

const enviar = (cuerpo) => request(app).post("/api/pedidos/webhook").send(cuerpo);

beforeEach(() => {
  jest.clearAllMocks();
  mockProcesarPago.mockResolvedValue("pagado");
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

const logs = () => JSON.stringify(console.error.mock.calls);

describe("eventos ignorables: 200", () => {
  test("un evento que no es de pago no se procesa", async () => {
    const respuesta = await enviar({ type: "merchant_order", data: { id: "5" } });

    expect(respuesta.status).toBe(200);
    expect(mockProcesarPago).not.toHaveBeenCalled();
  });

  test.each([
    ["sin body", undefined],
    ["sin data", { type: "payment" }],
    ["id vacio", { type: "payment", data: { id: "" } }],
    ["id no numerico", { type: "payment", data: { id: "abc; DROP TABLE pedidos" } }],
    ["id como objeto", { type: "payment", data: { id: {} } }],
  ])("pago %s: 200 sin procesar", async (_, cuerpo) => {
    const respuesta = await (cuerpo === undefined ? request(app).post("/api/pedidos/webhook") : enviar(cuerpo));

    expect(respuesta.status).toBe(200);
    expect(mockProcesarPago).not.toHaveBeenCalled();
  });

  test("un pago ya procesado o ignorado por el servicio responde 200", async () => {
    mockProcesarPago.mockResolvedValue("ya_pagado");
    expect((await enviar({ type: "payment", data: { id: "9001" } })).status).toBe(200);
  });

  test("mercado pago responde 404 (pago inexistente, por ejemplo la notificacion de prueba): 200 y no se reintenta", async () => {
    mockProcesarPago.mockRejectedValue(Object.assign(new Error("Payment not found"), { status: 404 }));

    const respuesta = await enviar({ type: "payment", data: { id: "123456" } });
    expect(respuesta.status).toBe(200);
  });

  test("mercado pago responde 400: 200", async () => {
    mockProcesarPago.mockRejectedValue(Object.assign(new Error("bad request"), { status: 400 }));
    expect((await enviar({ type: "payment", data: { id: "9001" } })).status).toBe(200);
  });
});

describe("pago procesable", () => {
  test("pasa al servicio el id como texto", async () => {
    const respuesta = await enviar({ type: "payment", data: { id: 9001 } });

    expect(respuesta.status).toBe(200);
    expect(mockProcesarPago).toHaveBeenCalledWith("9001");
  });

  test("acepta el id en el query string (data.id) si el body no lo trae", async () => {
    const respuesta = await request(app).post("/api/pedidos/webhook?type=payment&data.id=777").send({});

    expect(respuesta.status).toBe(200);
    expect(mockProcesarPago).toHaveBeenCalledWith("777");
  });
});

describe("barrido de pedidos vencidos", () => {
  test("se ejecuta despues de procesar un pago", async () => {
    await enviar({ type: "payment", data: { id: "9001" } });

    expect(mockLiberarVencidos).toHaveBeenCalledTimes(1);
    expect(mockLiberarVencidos.mock.invocationCallOrder[0]).toBeGreaterThan(mockProcesarPago.mock.invocationCallOrder[0]);
  });

  test("no se ejecuta con eventos que no son de pago ni cuando el procesamiento falla", async () => {
    await enviar({ type: "merchant_order", data: { id: "5" } });
    mockProcesarPago.mockRejectedValue(Object.assign(new Error("caida"), { code: "ECONNRESET" }));
    await enviar({ type: "payment", data: { id: "9001" } });

    expect(mockLiberarVencidos).not.toHaveBeenCalled();
  });
});

describe("fallos reintentables: 500", () => {
  test.each([
    ["la base de datos falla", Object.assign(new Error("connection lost"), { code: "PROTOCOL_CONNECTION_LOST" })],
    ["deadlock", Object.assign(new Error("deadlock"), { code: "ER_LOCK_DEADLOCK" })],
    ["mercado pago responde 500", Object.assign(new Error("server error"), { status: 500 })],
    ["mercado pago responde 429", Object.assign(new Error("rate limit"), { status: 429 })],
    ["el access token es invalido (401)", Object.assign(new Error("unauthorized"), { status: 401 })],
    ["no hay conexion con mercado pago", new Error("fetch failed")],
  ])("%s: 500 para que mercado pago reintente", async (_, error) => {
    mockProcesarPago.mockRejectedValue(error);

    const respuesta = await enviar({ type: "payment", data: { id: "9001" } });
    expect(respuesta.status).toBe(500);
  });

  test("el log lleva el id del pago y el motivo, pero no el body ni datos personales", async () => {
    mockProcesarPago.mockRejectedValue(Object.assign(new Error("connection lost"), { code: "PROTOCOL_CONNECTION_LOST" }));

    await enviar({ type: "payment", data: { id: "9001" }, nombre: "Juan Perez", email: "juan@mail.com" });

    expect(logs()).toContain("9001");
    expect(logs()).toContain("PROTOCOL_CONNECTION_LOST");
    expect(logs()).not.toMatch(/Juan|juan@/);
  });
});
