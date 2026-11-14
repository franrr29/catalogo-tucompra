process.env.SECRET_PASSW = "secreto-de-test";

const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const request = require("supertest");

const verificarToken = require("./auth.middle");

const app = express();
app.use(cookieParser());
app.get("/protegida", verificarToken, (req, res) => res.json({ mensaje: "ok" }));

test("sin cookie responde 401 'Token requerido para continuar'", async () => {
  const respuesta = await request(app).get("/protegida");

  expect(respuesta.status).toBe(401);
  expect(respuesta.body.mensaje).toBe("Token requerido para continuar");
});

test("cookie con basura responde 401 'Token invalido o expirado'", async () => {
  const respuesta = await request(app).get("/protegida").set("Cookie", "token=basura");

  expect(respuesta.status).toBe(401);
  expect(respuesta.body.mensaje).toBe("Token invalido o expirado");
});

test("token firmado con otro secret responde 401", async () => {
  const token = jwt.sign({ user: "admin" }, "otro-secret", { expiresIn: "1h" });
  const respuesta = await request(app).get("/protegida").set("Cookie", `token=${token}`);

  expect(respuesta.status).toBe(401);
  expect(respuesta.body.mensaje).toBe("Token invalido o expirado");
});

test("token vencido responde 401", async () => {
  const token = jwt.sign({ user: "admin" }, "secreto-de-test", { expiresIn: -10 });
  const respuesta = await request(app).get("/protegida").set("Cookie", `token=${token}`);

  expect(respuesta.status).toBe(401);
  expect(respuesta.body.mensaje).toBe("Token invalido o expirado");
});

test("token valido deja pasar y renueva la cookie", async () => {
  const token = jwt.sign({ user: "admin" }, "secreto-de-test", { expiresIn: "1h" });
  const respuesta = await request(app).get("/protegida").set("Cookie", `token=${token}`);

  expect(respuesta.status).toBe(200);
  expect(respuesta.headers["set-cookie"][0]).toMatch(/^token=/);
});
