process.env.MP_ACCESS_TOKEN = "test-token";

// mockeo la base de datos y mercado pago: ningun test toca la base real ni llama a mercado pago
jest.mock("../config/db", () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

jest.mock("../config/mercadoPago.js", () => ({}));

// el barrido de pedidos vencidos tiene sus propios tests: aca se mockea para que no consuma las respuestas de la base
const mockLiberarVencidos = jest.fn().mockResolvedValue(0);
jest.mock("./pedidos.vencimiento", () => ({ liberarPedidosVencidos: (...args) => mockLiberarVencidos(...args) }));

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

const PEDIDO = {
  nombre: "Juan Perez",
  email: "juan@mail.com",
  telefono: "099 123 456",
  items: [{ productoId: 1, cantidad: 2 }],
  envio: { tipoEntrega: "domicilio", cedula: "1.234.567-8", departamento: "Montevideo", ciudad: "Pocitos", direccion: "Calle Falsa 123" },
};

let conexion;

// la consulta de productos devuelve la fila con el costo indicado
function productoConCosto(costo) {
  baseDatos.query.mockResolvedValue([[{ id: 1, nombre: "G-Shock", precio: "100.00", costo, stock: 10 }]]);
}

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
  mockCrearPreferencia.mockResolvedValue({ init_point: "https://mp.test/pagar" });
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
  console.log.mockRestore();
});

const consultaDeItems = () => conexion.query.mock.calls[1];

describe("foto del costo en los items del pedido", () => {
  test("guarda el costo actual del producto como costo_unitario, en la misma transaccion", async () => {
    productoConCosto("60.00");

    const respuesta = await request(app).post("/api/pedidos").send(PEDIDO);

    expect(respuesta.status).toBe(200);
    const [sql, [filas]] = consultaDeItems();
    expect(sql).toMatch(/INSERT INTO pedido_items \(pedido_id, producto_id, cantidad, precio_unitario, costo_unitario\)/);
    expect(filas).toEqual([[55, 1, 2, "100.00", "60.00"]]);
    expect(conexion.beginTransaction).toHaveBeenCalledTimes(1);
    expect(conexion.commit).toHaveBeenCalledTimes(1);
  });

  test("producto sin costo cargado: costo_unitario queda null, nunca 0", async () => {
    productoConCosto(null);

    await request(app).post("/api/pedidos").send(PEDIDO);

    expect(consultaDeItems()[1][0]).toEqual([[55, 1, 2, "100.00", null]]);
  });

  test("columna de costo todavia inexistente en la fila: tambien queda null y el pedido se crea", async () => {
    baseDatos.query.mockResolvedValue([[{ id: 1, nombre: "G-Shock", precio: "100.00", stock: 10 }]]);

    const respuesta = await request(app).post("/api/pedidos").send(PEDIDO);

    expect(respuesta.status).toBe(200);
    expect(consultaDeItems()[1][0][0][4]).toBeNull();
  });

  test("un costo de 0 es un costo valido y se guarda como 0", async () => {
    productoConCosto("0.00");

    await request(app).post("/api/pedidos").send(PEDIDO);

    expect(consultaDeItems()[1][0][0][4]).toBe("0.00");
  });

  test("no cambia el total, el stock ni la preferencia de mercado pago, ni expone el costo", async () => {
    productoConCosto("60.00");

    const respuesta = await request(app).post("/api/pedidos").send(PEDIDO);

    expect(respuesta.body.pedido).toEqual({ id: 55, total: 200, init_point: "https://mp.test/pagar" });
    expect(conexion.query.mock.calls[0][1][3]).toBe(200); // total del INSERT del pedido
    expect(conexion.query.mock.calls[2][1]).toEqual([2, 1, 2]); // UPDATE stock: cantidad, id, cantidad
    const { body } = mockCrearPreferencia.mock.calls[0][0];
    expect(JSON.stringify(body)).not.toMatch(/costo/);
    expect(JSON.stringify(respuesta.body)).not.toMatch(/costo/);
  });
});
