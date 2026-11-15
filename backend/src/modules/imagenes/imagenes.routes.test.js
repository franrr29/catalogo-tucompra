process.env.SECRET_PASSW = "secreto-de-test";
process.env.FRONTEND_URL = "https://tienda.ejemplo.test";

// mockeo la base de datos y cloudinary para no depender de servicios externos en el test
jest.mock("../../config/db", () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

const mockSubida = jest.fn();
jest.mock("../../config/cloudinary", () => ({
  cloudinary: { uploader: { destroy: jest.fn() } },
  // el mock registra si multer llego a ejecutarse: una peticion rechazada no debe llegar ni a recibir los archivos
  upload: { fields: () => (req, res, next) => { mockSubida(); next(); } },
}));

const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const imagenesRoutes = require("./imagenes.routes");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/imagenes", imagenesRoutes);

test("subir imagenes sin token devuelve 401", async () => {
  const respuesta = await request(app).post("/api/imagenes/1");

  expect(respuesta.status).toBe(401);
});

describe("subida de imagenes: proteccion contra CSRF", () => {
  const cookie = () => `token=${jwt.sign({ user: "admin" }, "secreto-de-test", { expiresIn: "1h" })}`;

  beforeEach(() => {
    mockSubida.mockClear();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test("con sesion pero desde otro origen: 403 y multer no se ejecuta", async () => {
    const respuesta = await request(app).post("/api/imagenes/1").set("Cookie", cookie()).set("Origin", "https://sitio-malo.test");

    expect(respuesta.status).toBe(403);
    expect(mockSubida).not.toHaveBeenCalled();
  });

  test("con sesion y sin Origin: 403 y multer no se ejecuta", async () => {
    const respuesta = await request(app).post("/api/imagenes/1").set("Cookie", cookie());

    expect(respuesta.status).toBe(403);
    expect(mockSubida).not.toHaveBeenCalled();
  });

  test("con sesion y el Origin del frontend: llega a multer", async () => {
    await request(app).post("/api/imagenes/1").set("Cookie", cookie()).set("Origin", "https://tienda.ejemplo.test");

    expect(mockSubida).toHaveBeenCalledTimes(1);
  });

  test("borrar y cambiar la imagen principal tambien exigen el origen", async () => {
    const borrar = await request(app).delete("/api/imagenes/3").set("Cookie", cookie()).set("Origin", "https://sitio-malo.test");
    const principal = await request(app).patch("/api/imagenes/3").set("Cookie", cookie());

    expect(borrar.status).toBe(403);
    expect(principal.status).toBe(403);
  });
});
