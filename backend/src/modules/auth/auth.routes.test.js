process.env.ADMIN_USER = "admin";
process.env.ADMIN_PASSWORD = "clave123";
process.env.SECRET_PASSW = "secreto-de-test";

const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");

const authRoutes = require("./auth.routes");

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
