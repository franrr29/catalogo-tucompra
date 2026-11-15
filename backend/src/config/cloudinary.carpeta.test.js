// mockeo el storage y multer para ver con que carpeta se configura, sin llamar a cloudinary
const mockStorage = jest.fn();
jest.mock("multer-storage-cloudinary", () => ({ CloudinaryStorage: function (opciones) { mockStorage(opciones); } }));
jest.mock("multer", () => jest.fn(() => ({})));

const ENTORNO_ORIGINAL = { ...process.env };

function cargar(carpeta) {
  jest.resetModules();
  mockStorage.mockClear();
  if (carpeta === undefined) delete process.env.CLOUDINARY_CARPETA;
  else process.env.CLOUDINARY_CARPETA = carpeta;
  require("./cloudinary");
  return mockStorage.mock.calls[0][0].params.folder;
}

afterEach(() => {
  process.env = { ...ENTORNO_ORIGINAL };
});

test("sin CLOUDINARY_CARPETA usa la carpeta de siempre", () => {
  expect(cargar(undefined)).toBe("tu-compra-productos");
});

test("una variable vacia o con solo espacios tambien usa la de siempre", () => {
  expect(cargar("")).toBe("tu-compra-productos");
  expect(cargar("   ")).toBe("tu-compra-productos");
});

test("con CLOUDINARY_CARPETA usa esa carpeta", () => {
  expect(cargar(" tu-compra-dev ")).toBe("tu-compra-dev");
});
