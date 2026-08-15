process.env.SECRET_PASSW = "secreto-de-test";

// mockeo la base de datos y cloudinary para no depender de servicios externos en el test
jest.mock("../../config/db", () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

jest.mock("../../config/cloudinary", () => ({
  cloudinary: { uploader: { destroy: jest.fn() } },
  upload: { fields: () => (req, res, next) => next() },
}));

const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");

const imagenesRoutes = require("./imagenes.routes");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/imagenes", imagenesRoutes);

test("subir imagenes sin token devuelve 401", async () => {
  const respuesta = await request(app).post("/api/imagenes/1");

  expect(respuesta.status).toBe(401);
});
