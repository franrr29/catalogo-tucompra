process.env.ADMIN_USER = "admin";
process.env.ADMIN_PASSWORD = "clave123";
process.env.SECRET_PASSW = "secreto-de-test";

const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");

const authRoutes = require("./auth.routes");
const { limitadorLogin } = require("../../middleware/limiteLogin");

// todos los tests salen de la misma ip: el contador del limite de login se reinicia entre pruebas
beforeEach(() => {
  limitadorLogin.reiniciar();
});

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/login", authRoutes);

test("login con usuario y clave correctos devuelve cookie", async () => {
  const respuesta = await request(app)
    .post("/api/login/login")
    .send({ user: "admin", password: "clave123" });

  expect(respuesta.status).toBe(200);
  expect(respuesta.headers["set-cookie"]).toBeDefined();
});

test("login con clave incorrecta devuelve 401", async () => {
  const respuesta = await request(app)
    .post("/api/login/login")
    .send({ user: "admin", password: "clave-equivocada" });

  expect(respuesta.status).toBe(401);
});

describe("errores del login", () => {
  const ENTORNO = { ...process.env };

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...ENTORNO };
    console.error.mockRestore();
  });

  test("sin body responde 400 y no 500", async () => {
    const respuesta = await request(app).post("/api/login/login");
    expect(respuesta.status).toBe(400);
  });

  test("sin usuario o sin contrasena responde 400", async () => {
    expect((await request(app).post("/api/login/login").send({ user: "admin" })).status).toBe(400);
    expect((await request(app).post("/api/login/login").send({ password: "clave123" })).status).toBe(400);
  });

  test("credenciales con tipos raros (objetos) son 401, no 500", async () => {
    const respuesta = await request(app)
      .post("/api/login/login")
      .send({ user: { $ne: "" }, password: { $ne: "" } });
    expect(respuesta.status).toBe(401);
  });

  test("un error del servidor (sin contrasena configurada) responde 500 generico, sin filtrar el motivo", async () => {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD_HASH;

    const respuesta = await request(app).post("/api/login/login").send({ user: "admin", password: "clave123" });

    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({ mensaje: "error interno del servidor" });
    // el motivo queda en el log del servidor, sin la contrasena que se envio
    expect(JSON.stringify(console.error.mock.calls)).toContain("ADMIN_PASSWORD_HASH");
    expect(JSON.stringify(console.error.mock.calls)).not.toContain("clave123");
  });

  test("un secreto de token faltante tambien es 500 generico y no 401", async () => {
    delete process.env.SECRET_PASSW;

    const respuesta = await request(app).post("/api/login/login").send({ user: "admin", password: "clave123" });

    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({ mensaje: "error interno del servidor" });
  });

  test("credenciales incorrectas siguen siendo 401 con su mensaje", async () => {
    const respuesta = await request(app).post("/api/login/login").send({ user: "admin", password: "mala" });
    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toEqual({ mensaje: "credenciales incorrectas" });
  });
});
