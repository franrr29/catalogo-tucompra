process.env.ADMIN_USER = "admin";
process.env.ADMIN_PASSWORD = "clave123";
process.env.SECRET_PASSW = "secreto-de-test";

const express = require("express");
const request = require("supertest");
const { crearLimitador, leerSaltosDeProxy } = require("./limiteLogin");

// app de prueba: el "login" responde 200 si la clave es la correcta y 401 si no; la ip sale de x-forwarded-for
function crearApp(limitador, saltos = 1) {
  const app = express();
  app.set("trust proxy", saltos);
  app.use(express.json());
  app.post("/login", limitador.middleware, (req, res) => {
    if (req.body?.password === "ok") return res.json({ mensaje: "sesion iniciada" });
    res.status(401).json({ mensaje: "credenciales incorrectas" });
  });
  return app;
}

const intentar = (app, ip, password = "mala") =>
  request(app).post("/login").set("X-Forwarded-For", ip).send({ password });

describe("limite de intentos por ip", () => {
  let tiempo;
  let limitador;
  let app;

  beforeEach(() => {
    tiempo = 1_000_000;
    limitador = crearLimitador({ maxIntentos: 5, ventanaMs: 15 * 60 * 1000, ahora: () => tiempo });
    app = crearApp(limitador);
  });

  test("permite 5 intentos fallidos y el sexto recibe 429 con Retry-After", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await intentar(app, "1.1.1.1")).status).toBe(401);
    }

    const bloqueado = await intentar(app, "1.1.1.1");
    expect(bloqueado.status).toBe(429);
    expect(Number(bloqueado.headers["retry-after"])).toBeGreaterThan(0);
    expect(Number(bloqueado.headers["retry-after"])).toBeLessThanOrEqual(15 * 60);
    expect(typeof bloqueado.body.mensaje).toBe("string");
  });

  test("bloqueado, ni siquiera la clave correcta entra", async () => {
    for (let i = 0; i < 5; i++) await intentar(app, "1.1.1.1");

    expect((await intentar(app, "1.1.1.1", "ok")).status).toBe(429);
  });

  test("una ip bloqueada no afecta a las demas", async () => {
    for (let i = 0; i < 6; i++) await intentar(app, "1.1.1.1");

    expect((await intentar(app, "2.2.2.2")).status).toBe(401);
    expect((await intentar(app, "2.2.2.2", "ok")).status).toBe(200);
  });

  test("un login correcto limpia el contador de esa ip", async () => {
    for (let i = 0; i < 4; i++) await intentar(app, "1.1.1.1");
    expect((await intentar(app, "1.1.1.1", "ok")).status).toBe(200);

    // vuelve a tener los 5 intentos completos
    for (let i = 0; i < 5; i++) {
      expect((await intentar(app, "1.1.1.1")).status).toBe(401);
    }
    expect((await intentar(app, "1.1.1.1")).status).toBe(429);
  });

  test("pasada la ventana se vuelve a permitir", async () => {
    for (let i = 0; i < 6; i++) await intentar(app, "1.1.1.1");
    expect((await intentar(app, "1.1.1.1")).status).toBe(429);

    tiempo += 15 * 60 * 1000;

    expect((await intentar(app, "1.1.1.1", "ok")).status).toBe(200);
  });

  test("las peticiones en paralelo tampoco se pasan del limite", async () => {
    const respuestas = await Promise.all(Array.from({ length: 12 }, () => intentar(app, "3.3.3.3")));

    expect(respuestas.filter((r) => r.status === 401)).toHaveLength(5);
    expect(respuestas.filter((r) => r.status === 429)).toHaveLength(7);
  });

  test("con trust proxy usa la ip del cliente, no la del proxy: dos clientes distintos no comparten contador", async () => {
    for (let i = 0; i < 6; i++) await intentar(app, "4.4.4.4");

    expect((await intentar(app, "5.5.5.5")).status).toBe(401);
  });

  test("la memoria esta acotada: nunca guarda mas de maxEntradas ips", async () => {
    const chico = crearLimitador({ maxIntentos: 5, maxEntradas: 3, ahora: () => tiempo });
    const appChica = crearApp(chico);

    for (let i = 1; i <= 10; i++) await intentar(appChica, `9.9.9.${i}`);

    expect(chico.tamano()).toBeLessThanOrEqual(3);
  });
});

describe("leerSaltosDeProxy", () => {
  test.each([
    [undefined, 1],
    ["", 1],
    ["abc", 1],
    ["-1", 1],
    ["1.5", 1],
    ["0", 0],
    ["1", 1],
    ["2", 2],
    [" 2 ", 2],
  ])("%p -> %p", (valor, esperado) => {
    expect(leerSaltosDeProxy(valor)).toBe(esperado);
  });
});

describe("conectado a la ruta real de login", () => {
  test("despues de 5 claves malas el login real responde 429", async () => {
    jest.resetModules();
    const { limitadorLogin } = require("./limiteLogin");
    limitadorLogin.reiniciar();
    const authRoutes = require("../modules/auth/auth.routes");

    const app = express();
    app.set("trust proxy", 1);
    app.use(express.json());
    app.use("/api/login", authRoutes);

    const mala = () => request(app).post("/api/login/login").set("X-Forwarded-For", "8.8.8.8").send({ user: "admin", password: "mala" });
    for (let i = 0; i < 5; i++) expect((await mala()).status).toBe(401);
    expect((await mala()).status).toBe(429);
  });
});
