// mockeo la base de datos y cloudinary para no depender de servicios externos en el test
jest.mock("../../config/db", () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

jest.mock("../../config/cloudinary", () => ({
  cloudinary: { uploader: { destroy: jest.fn() } },
}));

const baseDatos = require("../../config/db");
const { cloudinary } = require("../../config/cloudinary");
const { eliminarImagen } = require("./imagenes.service");

const URL_IMAGEN = "https://res.cloudinary.com/demo/image/upload/v123/tu-compra-productos/abc123.jpg";
const IMAGEN = { id: 5, producto_id: 2, orden: 1, imagen_url: URL_IMAGEN };

beforeEach(() => {
  baseDatos.query.mockReset();
  cloudinary.uploader.destroy.mockReset();
  cloudinary.uploader.destroy.mockResolvedValue({ result: "ok" });
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

test("borra la fila de la base y la imagen en cloudinary invalidando el cache del CDN", async () => {
  baseDatos.query
    .mockResolvedValueOnce([[IMAGEN]])            // SELECT de la imagen
    .mockResolvedValueOnce([{ affectedRows: 1 }]) // DELETE
    .mockResolvedValueOnce([[{ id: 1 }]]);        // todavia hay portada

  await eliminarImagen(5);

  expect(baseDatos.query).toHaveBeenCalledWith("DELETE FROM producto_imagenes WHERE id = ?", [5]);
  expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("tu-compra-productos/abc123", { invalidate: true });
});

test("si la imagen no existe devuelve 404 y no toca cloudinary", async () => {
  baseDatos.query.mockResolvedValueOnce([[]]);

  await expect(eliminarImagen(99)).rejects.toMatchObject({ status: 404 });
  expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
});

test("un id que no es numero devuelve 400", async () => {
  await expect(eliminarImagen(NaN)).rejects.toMatchObject({ status: 400 });
  expect(baseDatos.query).not.toHaveBeenCalled();
});

test("si se borra la principal, otra imagen del producto pasa a orden 0", async () => {
  baseDatos.query
    .mockResolvedValueOnce([[{ ...IMAGEN, orden: 0 }]])
    .mockResolvedValueOnce([{ affectedRows: 1 }])
    .mockResolvedValueOnce([[]])                  // ya no queda portada
    .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE que promueve otra

  await eliminarImagen(5);

  const ultimaConsulta = baseDatos.query.mock.calls[3];
  expect(ultimaConsulta[0]).toMatch(/UPDATE producto_imagenes SET orden = 0 WHERE producto_id = \? ORDER BY orden ASC, id ASC LIMIT 1/);
  expect(ultimaConsulta[1]).toEqual([2]);
});

test("si cloudinary falla igual se borra la fila y no se lanza error", async () => {
  cloudinary.uploader.destroy.mockRejectedValue(new Error("cloudinary caido"));
  baseDatos.query
    .mockResolvedValueOnce([[IMAGEN]])
    .mockResolvedValueOnce([{ affectedRows: 1 }])
    .mockResolvedValueOnce([[{ id: 1 }]]);

  await expect(eliminarImagen(5)).resolves.toBeUndefined();
  expect(baseDatos.query).toHaveBeenCalledWith("DELETE FROM producto_imagenes WHERE id = ?", [5]);
  expect(console.error).toHaveBeenCalled();
});

test("si la base de datos falla al borrar, el error se propaga y cloudinary no se toca", async () => {
  baseDatos.query
    .mockResolvedValueOnce([[IMAGEN]])
    .mockRejectedValueOnce(new Error("db caida"));

  await expect(eliminarImagen(5)).rejects.toThrow("db caida");
  expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
});
