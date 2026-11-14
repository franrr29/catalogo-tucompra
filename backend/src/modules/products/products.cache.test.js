process.env.SECRET_PASSW = "secreto-de-test";

// mockeo la base de datos y cloudinary para no depender de servicios externos en el test
jest.mock("../../config/db", () => ({
  query: jest.fn().mockResolvedValue([[]]),
  getConnection: jest.fn(),
}));

jest.mock("../../config/cloudinary", () => ({
  cloudinary: { uploader: { destroy: jest.fn() } },
}));

const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");

const productosRoutes = require("./products.routes");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/productos", productosRoutes);

test("el listado publico se sigue cacheando 60s", async () => {
  const respuesta = await request(app).get("/api/productos");

  expect(respuesta.status).toBe(200);
  expect(respuesta.headers["cache-control"]).toBe("public, max-age=60");
});

test("el listado con ?fresh=1 (panel de admin) no se cachea", async () => {
  const respuesta = await request(app).get("/api/productos?fresh=1");

  expect(respuesta.status).toBe(200);
  expect(respuesta.headers["cache-control"]).toBe("no-store");
});

test("crear producto sin cookie devuelve 401 con el mensaje de token requerido", async () => {
  const respuesta = await request(app).post("/api/productos").send({ nombre: "x", precio: 1, stock: 1 });

  expect(respuesta.status).toBe(401);
  expect(respuesta.body.mensaje).toBe("Token requerido para continuar");
});
