process.env.SECRET_PASSW = "secreto-de-test";
process.env.FRONTEND_URL = "https://tienda.ejemplo.test";

const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const {
  leerSesionMaxHoras,
  segundosRestantes,
  duracionDelToken,
  inicioDeSesion,
} = require("./sesion");
const verificarToken = require("../../middleware/auth.middle");

const ENTORNO = { ...process.env };
const ahora = () => Math.floor(Date.now() / 1000);

describe("leerSesionMaxHoras", () => {
  test.each([
    [undefined, 12],
    ["", 12],
    ["abc", 12],
    ["-3", 12],
    ["0", 12],
    ["1e2", 12],
    ["8", 8],
    ["0.5", 0.5],
    [" 24 ", 24],
  ])("%p -> %p", (valor, esperado) => expect(leerSesionMaxHoras(valor)).toBe(esperado));
});

describe("calculo de duracion", () => {
  test("segundosRestantes cuenta desde el inicio de la sesion", () => {
    expect(segundosRestantes(1000, 1000 + 3600, 12)).toBe(12 * 3600 - 3600);
    expect(segundosRestantes(1000, 1000 + 12 * 3600, 12)).toBe(0);
    expect(segundosRestantes(1000, 1000 + 13 * 3600, 12)).toBeLessThan(0);
  });

  test("duracionDelToken: 1 hora, salvo que quede menos sesion", () => {
    expect(duracionDelToken(10 * 3600)).toBe(3600);
    expect(duracionDelToken(600)).toBe(600);
    expect(duracionDelToken(0)).toBe(1);
  });

  test("inicioDeSesion usa inicio, o iat si el token es anterior a este cambio", () => {
    expect(inicioDeSesion({ inicio: 500, iat: 900 })).toBe(500);
    expect(inicioDeSesion({ iat: 900 })).toBe(900);
    expect(inicioDeSesion({})).toBe(0);
  });
});

describe("limite absoluto en el middleware", () => {
  const app = express();
  app.use(cookieParser());
  app.get("/protegida", verificarToken, (req, res) => res.json({ mensaje: "ok" }));

  const cookieCon = (claims, opciones = { expiresIn: "1h" }) =>
    `token=${jwt.sign({ user: "admin", ...claims }, "secreto-de-test", opciones)}`;
  const claimsDe = (respuesta) => {
    const valor = respuesta.headers["set-cookie"][0].split(";")[0].split("=")[1];
    return jwt.decode(valor);
  };

  beforeEach(() => {
    delete process.env.SESION_MAX_HORAS;
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...ENTORNO };
    console.error.mockRestore();
  });

  test("una sesion reciente se renueva conservando el inicio", async () => {
    const inicio = ahora() - 3600;
    const respuesta = await request(app).get("/protegida").set("Cookie", cookieCon({ inicio }));

    expect(respuesta.status).toBe(200);
    expect(claimsDe(respuesta).inicio).toBe(inicio);
  });

  test("renovar no estira la sesion: el inicio no cambia aunque se use varias veces seguidas", async () => {
    const inicio = ahora() - 5 * 3600;
    let cookie = cookieCon({ inicio });

    for (let i = 0; i < 3; i++) {
      const respuesta = await request(app).get("/protegida").set("Cookie", cookie);
      expect(respuesta.status).toBe(200);
      cookie = respuesta.headers["set-cookie"][0].split(";")[0];
      expect(claimsDe(respuesta).inicio).toBe(inicio);
    }
  });

  test("pasadas 12 horas desde el login: 401, aunque el token todavia no haya vencido, y se borra la cookie", async () => {
    const inicio = ahora() - 12 * 3600 - 5;
    const respuesta = await request(app).get("/protegida").set("Cookie", cookieCon({ inicio }));

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.mensaje).toBe("Sesion expirada");
    expect(respuesta.headers["set-cookie"][0]).toMatch(/^token=;/);
  });

  test("cerca del limite el token nuevo dura solo lo que queda de sesion", async () => {
    const inicio = ahora() - 12 * 3600 + 600; // quedan ~10 minutos
    const respuesta = await request(app).get("/protegida").set("Cookie", cookieCon({ inicio }));

    expect(respuesta.status).toBe(200);
    const claims = claimsDe(respuesta);
    expect(claims.exp - claims.iat).toBeLessThanOrEqual(600);
    expect(claims.exp - claims.iat).toBeGreaterThan(500);
    // y la cookie tampoco dura mas que eso
    const maxAge = Number(/Max-Age=(\d+)/.exec(respuesta.headers["set-cookie"][0])[1]);
    expect(maxAge).toBeLessThanOrEqual(600);
  });

  test("SESION_MAX_HORAS cambia el limite", async () => {
    process.env.SESION_MAX_HORAS = "2";
    const inicio = ahora() - 3 * 3600;
    const respuesta = await request(app).get("/protegida").set("Cookie", cookieCon({ inicio }));

    expect(respuesta.status).toBe(401);
  });

  test("un token anterior a este cambio (sin inicio) sigue entrando y usa su iat", async () => {
    const respuesta = await request(app).get("/protegida").set("Cookie", cookieCon({}));

    expect(respuesta.status).toBe(200);
    expect(claimsDe(respuesta).inicio).toBeGreaterThan(ahora() - 5);
  });

  test("un token sin inicio emitido hace mas del limite tambien se rechaza", async () => {
    const iat = ahora() - 13 * 3600;
    const respuesta = await request(app).get("/protegida").set("Cookie", cookieCon({ iat }, { expiresIn: "20h", noTimestamp: false }));

    expect(respuesta.status).toBe(401);
  });

  test("un inicio falsificado no sirve: el token esta firmado", async () => {
    const falso = jwt.sign({ user: "admin", inicio: ahora() }, "otro-secreto", { expiresIn: "1h" });
    const respuesta = await request(app).get("/protegida").set("Cookie", `token=${falso}`);

    expect(respuesta.status).toBe(401);
  });

  test("solo se acepta HS256: un token sin firma (alg none) se rechaza", async () => {
    const sinFirma = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${Buffer.from(
      JSON.stringify({ user: "admin", inicio: ahora() })
    ).toString("base64url")}.`;
    const respuesta = await request(app).get("/protegida").set("Cookie", `token=${sinFirma}`);

    expect(respuesta.status).toBe(401);
  });
});
