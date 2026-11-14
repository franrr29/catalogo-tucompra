process.env.SECRET_PASSW = "secreto-de-test";

// mockeo la base de datos y cloudinary: ningun test toca la base real ni servicios externos
jest.mock("../../config/db", () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

jest.mock("../../config/cloudinary", () => ({
  cloudinary: { uploader: { destroy: jest.fn() } },
}));

const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const baseDatos = require("../../config/db");
const productosRoutes = require("./products.routes");
const productosAdminRoutes = require("./products.admin.routes");
const cartRoutes = require("../cart/cart.routes");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/productos", productosRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin/productos", productosAdminRoutes);

const cookieAdmin = () => `token=${jwt.sign({ user: "admin" }, "secreto-de-test", { expiresIn: "1h" })}`;
const sqlDeLaConsulta = (n = 0) => baseDatos.query.mock.calls[n][0];

beforeEach(() => {
  baseDatos.query.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe("el costo nunca sale por la tienda publica", () => {
  // la base real solo devuelve lo que el SQL pide: si el SQL no usa * ni nombra costo, no puede salir
  function afirmarSinCosto(sql) {
    expect(sql).not.toMatch(/\*/);
    expect(sql).not.toMatch(/costo/i);
  }

  test("GET /api/productos (listado)", async () => {
    baseDatos.query.mockResolvedValue([[{ id: 1, nombre: "Reloj", precio: "100.00" }]]);

    const respuesta = await request(app).get("/api/productos");

    expect(respuesta.status).toBe(200);
    afirmarSinCosto(sqlDeLaConsulta());
    expect(JSON.stringify(respuesta.body)).not.toMatch(/costo/);
  });

  test("GET /api/productos/:id (detalle)", async () => {
    baseDatos.query.mockResolvedValue([[{ id: 1, nombre: "Reloj", precio: "100.00", foto_id: null }]]);

    const respuesta = await request(app).get("/api/productos/1");

    expect(respuesta.status).toBe(200);
    afirmarSinCosto(sqlDeLaConsulta());
  });

  test("POST /api/cart/add (producto del carrito)", async () => {
    baseDatos.query.mockResolvedValue([[{ id: 1, nombre: "Reloj", precio: "100.00", stock: 3 }]]);

    const respuesta = await request(app).post("/api/cart/add").send({ productId: 1 });

    expect(respuesta.status).toBe(200);
    afirmarSinCosto(sqlDeLaConsulta());
  });

  test("POST /api/cart/verificar (verificacion del carrito)", async () => {
    baseDatos.query.mockResolvedValue([[{ id: 1, nombre: "Reloj", precio: "100.00", stock: 3 }]]);

    const respuesta = await request(app).post("/api/cart/verificar").send({ productosIds: [1] });

    expect(respuesta.status).toBe(200);
    afirmarSinCosto(sqlDeLaConsulta());
  });
});

describe("GET /api/admin/productos", () => {
  test("sin cookie devuelve 401 y no consulta la base", async () => {
    const respuesta = await request(app).get("/api/admin/productos");

    expect(respuesta.status).toBe(401);
    expect(baseDatos.query).not.toHaveBeenCalled();
  });

  test("devuelve los mismos productos que la lista publica (activos) mas el costo, sin cache", async () => {
    baseDatos.query.mockResolvedValue([[{ id: 1, nombre: "Reloj", precio: "100.00", costo: "60.00" }]]);

    const respuesta = await request(app).get("/api/admin/productos").set("Cookie", cookieAdmin());

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers["cache-control"]).toBe("no-store");
    expect(respuesta.body[0].costo).toBe("60.00");

    const sqlAdmin = sqlDeLaConsulta();
    expect(sqlAdmin).toMatch(/p\.costo/);
    expect(sqlAdmin).toMatch(/WHERE p\.activo = 1/);

    // es la misma consulta que la publica salvo por p.costo
    baseDatos.query.mockClear();
    await request(app).get("/api/productos");
    const sqlPublico = sqlDeLaConsulta();
    const normalizar = (sql) => sql.replace(/\s+/g, " ").trim();
    expect(normalizar(sqlAdmin).replace(" p.costo,", "")).toBe(normalizar(sqlPublico));
  });
});

describe("PATCH /api/productos/:id distingue los tres casos de costo", () => {
  beforeEach(() => {
    baseDatos.query.mockResolvedValue([{ affectedRows: 1 }]);
  });

  const parchear = (cuerpo) => request(app).patch("/api/productos/7").set("Cookie", cookieAdmin()).send(cuerpo);

  test("costo no enviado: no se toca la columna", async () => {
    const respuesta = await parchear({ nombre: "Nuevo nombre" });

    expect(respuesta.status).toBe(200);
    const [sql, valores] = baseDatos.query.mock.calls[0];
    expect(sql).not.toMatch(/costo/);
    expect(valores).toEqual(["Nuevo nombre", 7]);
  });

  test("costo vacio (texto vacio o null): se guarda NULL, costo desconocido", async () => {
    for (const vacio of ["", "   ", null]) {
      baseDatos.query.mockClear();
      const respuesta = await parchear({ costo: vacio });

      expect(respuesta.status).toBe(200);
      const [sql, valores] = baseDatos.query.mock.calls[0];
      expect(sql).toBe("UPDATE productos SET costo = ? WHERE id = ?");
      expect(valores).toEqual([null, 7]);
    }
  });

  test("costo 0 es valido: se guarda 0, no NULL (como numero o como texto)", async () => {
    for (const cero of [0, "0"]) {
      baseDatos.query.mockClear();
      const respuesta = await parchear({ costo: cero });

      expect(respuesta.status).toBe(200);
      const [sql, valores] = baseDatos.query.mock.calls[0];
      expect(sql).toBe("UPDATE productos SET costo = ? WHERE id = ?");
      expect(valores).toEqual([0, 7]);
    }
  });

  test("costo con valor: se guarda como numero junto a los demas campos", async () => {
    await parchear({ precio: 150, costo: "60.50" });

    const [sql, valores] = baseDatos.query.mock.calls[0];
    expect(sql).toBe("UPDATE productos SET precio = ?, costo = ? WHERE id = ?");
    expect(valores).toEqual([150, 60.5, 7]);
  });

  test.each([[-1], ["abc"], [true], [{}], [[]], [1e12]])("costo invalido (%p): 400 y no escribe", async (invalido) => {
    const respuesta = await parchear({ costo: invalido });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.mensaje).toMatch(/costo/);
    expect(baseDatos.query).not.toHaveBeenCalled();
  });
});

describe("POST /api/productos con costo", () => {
  beforeEach(() => {
    baseDatos.query.mockResolvedValue([{ insertId: 9 }]);
  });

  const crear = (cuerpo) => request(app).post("/api/productos").set("Cookie", cookieAdmin()).send(cuerpo);
  const BASE = { nombre: "Reloj", precio: 100, stock: 5 };

  test("sin costo se guarda NULL (desconocido)", async () => {
    await crear(BASE);

    const [sql, valores] = baseDatos.query.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO productos \(nombre, precio, stock, descripcion, costo\)/);
    expect(valores[4]).toBeNull();
  });

  test("con costo 0 guarda 0 y con costo 60 guarda 60", async () => {
    await crear({ ...BASE, costo: 0 });
    expect(baseDatos.query.mock.calls[0][1][4]).toBe(0);

    baseDatos.query.mockClear();
    await crear({ ...BASE, costo: "60" });
    expect(baseDatos.query.mock.calls[0][1][4]).toBe(60);
  });

  test("costo negativo: 400 y no inserta", async () => {
    const respuesta = await crear({ ...BASE, costo: -5 });

    expect(respuesta.status).toBe(400);
    expect(baseDatos.query).not.toHaveBeenCalled();
  });
});
