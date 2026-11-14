process.env.MP_ACCESS_TOKEN = "test-token";

// mockeo la base de datos para no conectarme a la real durante los tests
jest.mock("../config/db", () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const baseDatos = require("../config/db");
const pedidosRoutes = require("./pedidos.routes");

const app = express();
app.use(express.json());
app.use("/api/pedidos", pedidosRoutes);

beforeEach(() => {
  baseDatos.query.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

test("pedido existente: 200 con solo el estado", async () => {
  baseDatos.query.mockResolvedValueOnce([[{ estado: "pagado" }]]);

  const respuesta = await request(app).get("/api/pedidos/12");

  expect(respuesta.status).toBe(200);
  expect(respuesta.body).toEqual({ estado: "pagado" });
  expect(respuesta.headers["cache-control"]).toBe("no-store");
  expect(baseDatos.query).toHaveBeenCalledWith("SELECT estado FROM pedidos WHERE id = ?", [12]);
});

test("no filtra datos personales ni montos aunque la base devuelva mas columnas", async () => {
  baseDatos.query.mockResolvedValueOnce([[
    { estado: "pendiente", nombre: "Juan Perez", email: "juan@mail.com", telefono: "099123456", total: "1500.00" },
  ]]);

  const respuesta = await request(app).get("/api/pedidos/7");

  expect(respuesta.status).toBe(200);
  expect(Object.keys(respuesta.body)).toEqual(["estado"]);
  expect(JSON.stringify(respuesta.body)).not.toMatch(/Juan|juan@mail|099123456|1500/);
});

test("la consulta pide solo la columna estado", async () => {
  baseDatos.query.mockResolvedValueOnce([[{ estado: "cancelado" }]]);

  await request(app).get("/api/pedidos/3");

  const sql = baseDatos.query.mock.calls[0][0];
  expect(sql).toBe("SELECT estado FROM pedidos WHERE id = ?");
  expect(sql).not.toMatch(/nombre|email|telefono|total|\*/);
});

test("pedido inexistente: 404", async () => {
  baseDatos.query.mockResolvedValueOnce([[]]);

  const respuesta = await request(app).get("/api/pedidos/999");

  expect(respuesta.status).toBe(404);
  expect(respuesta.body).toEqual({ mensaje: "pedido no encontrado" });
});

test.each(["abc", "0", "-5", "1.5", "12abc", "99999999999999999999"])(
  "id invalido %s: 400 y no consulta la base",
  async (id) => {
    const respuesta = await request(app).get(`/api/pedidos/${id}`);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toEqual({ mensaje: "id de pedido invalido" });
    expect(baseDatos.query).not.toHaveBeenCalled();
  }
);

test("si la base falla: 500 con mensaje generico, sin detalles internos", async () => {
  baseDatos.query.mockRejectedValueOnce(new Error("Access denied for user 'secreto'@'host'"));

  const respuesta = await request(app).get("/api/pedidos/5");

  expect(respuesta.status).toBe(500);
  expect(respuesta.body).toEqual({ mensaje: "error interno del servidor" });
});
