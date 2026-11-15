process.env.SECRET_PASSW = "secreto-de-test";

const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { normalizarOrigen, leerOrigenesPermitidos, origenPermitido } = require("./verificarOrigen");
const verificarToken = require("./auth.middle");

const FRONTEND = "https://tienda.ejemplo.test";

describe("normalizarOrigen", () => {
  test.each([
    ["https://tienda.ejemplo.test", "https://tienda.ejemplo.test"],
    ["https://tienda.ejemplo.test/", "https://tienda.ejemplo.test"],
    ["HTTPS://TIENDA.Ejemplo.test/ruta?x=1", "https://tienda.ejemplo.test"],
    ["http://localhost:3000", "http://localhost:3000"],
    ["https://tienda.ejemplo.test:443", "https://tienda.ejemplo.test"],
  ])("%p -> %p", (entrada, esperado) => expect(normalizarOrigen(entrada)).toBe(esperado));

  test.each([[undefined], [null], [""], ["null"], ["*"], ["https://*.ejemplo.test"], ["ftp://x.test"], ["no es url"], [42]])(
    "descarta %p",
    (entrada) => expect(normalizarOrigen(entrada)).toBeNull()
  );
});

describe("leerOrigenesPermitidos", () => {
  test("usa FRONTEND_URL", () => {
    expect([...leerOrigenesPermitidos({ FRONTEND_URL: `${FRONTEND}/` })]).toEqual([FRONTEND]);
  });

  test("suma ORIGENES_PERMITIDOS y descarta comodines y basura", () => {
    const origenes = leerOrigenesPermitidos({
      FRONTEND_URL: FRONTEND,
      ORIGENES_PERMITIDOS: "https://www.ejemplo.test, *, https://*.otro.test, basura, ",
    });
    expect([...origenes].sort()).toEqual([FRONTEND, "https://www.ejemplo.test"].sort());
  });

  test("sin ninguna configuracion no permite nada (falla cerrado)", () => {
    expect(leerOrigenesPermitidos({}).size).toBe(0);
  });
});

describe("origenPermitido", () => {
  const pedido = (metodo, origen) => ({ method: metodo, get: (nombre) => (nombre === "Origin" ? origen : undefined) });
  const entorno = { FRONTEND_URL: FRONTEND };

  test.each(["GET", "HEAD", "OPTIONS"])("%s no necesita Origin", (metodo) => {
    expect(origenPermitido(pedido(metodo, undefined), entorno)).toBe(true);
  });

  test.each(["POST", "PUT", "PATCH", "DELETE"])("%s con el Origin del frontend pasa", (metodo) => {
    expect(origenPermitido(pedido(metodo, FRONTEND), entorno)).toBe(true);
  });

  test.each(["POST", "PUT", "PATCH", "DELETE"])("%s sin Origin se rechaza", (metodo) => {
    expect(origenPermitido(pedido(metodo, undefined), entorno)).toBe(false);
  });

  test.each([
    ["https://sitio-malo.test"],
    ["null"],
    ["http://tienda.ejemplo.test"], // otro esquema
    ["https://tienda.ejemplo.test.sitio-malo.test"], // el host solo empieza igual
    ["https://sitio-malo.test/https://tienda.ejemplo.test"],
    ["*"],
  ])("POST desde %p se rechaza", (origen) => {
    expect(origenPermitido(pedido("POST", origen), entorno)).toBe(false);
  });

  test("sin FRONTEND_URL configurado, ninguna escritura pasa", () => {
    expect(origenPermitido(pedido("POST", FRONTEND), {})).toBe(false);
  });
});

describe("dentro de verificarToken", () => {
  const ENTORNO = { ...process.env };
  const app = express();
  app.use(cookieParser());
  app.all("/protegida", verificarToken, (req, res) => res.json({ mensaje: "ok" }));
  const cookie = () => `token=${jwt.sign({ user: "admin" }, "secreto-de-test", { expiresIn: "1h" })}`;

  beforeEach(() => {
    process.env.FRONTEND_URL = FRONTEND;
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...ENTORNO };
    console.error.mockRestore();
  });

  test("POST con sesion y el Origin del frontend: 200", async () => {
    const respuesta = await request(app).post("/protegida").set("Cookie", cookie()).set("Origin", FRONTEND);
    expect(respuesta.status).toBe(200);
  });

  test("POST con sesion desde otro origen (CSRF): 403 y no se renueva la cookie", async () => {
    const respuesta = await request(app).post("/protegida").set("Cookie", cookie()).set("Origin", "https://sitio-malo.test");

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.mensaje).toBe("Origen no permitido");
    expect(respuesta.headers["set-cookie"]).toBeUndefined();
  });

  test("POST con sesion y sin Origin: 403", async () => {
    const respuesta = await request(app).post("/protegida").set("Cookie", cookie());
    expect(respuesta.status).toBe(403);
  });

  test("GET con sesion no necesita Origin", async () => {
    const respuesta = await request(app).get("/protegida").set("Cookie", cookie());
    expect(respuesta.status).toBe(200);
  });

  test("sin sesion sigue siendo 401 (la sesion se comprueba antes que el origen)", async () => {
    const respuesta = await request(app).post("/protegida").set("Origin", "https://sitio-malo.test");
    expect(respuesta.status).toBe(401);
  });
});
