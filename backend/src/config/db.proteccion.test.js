// mockeo mysql2 para no abrir ninguna conexion: solo se mira con que opciones se crea el pool
const mockCrearPool = jest.fn();
jest.mock("mysql2/promise", () => ({ createPool: (...args) => mockCrearPool(...args) }));

const ENTORNO_ORIGINAL = { ...process.env };

// carga db.js desde cero con las variables indicadas (el setup de jest ya dejo NODE_ENV=test y una url local)
function cargarDb(variables) {
  jest.resetModules();
  mockCrearPool.mockReset();
  mockCrearPool.mockReturnValue({
    query: jest.fn(),
    getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
  });
  Object.assign(process.env, variables);
  for (const clave of Object.keys(variables)) {
    if (variables[clave] === undefined) delete process.env[clave];
  }
  jest.spyOn(console, "log").mockImplementation(() => {});
  return require("./db");
}

afterEach(() => {
  process.env = { ...ENTORNO_ORIGINAL };
  jest.restoreAllMocks();
});

const URL_REMOTA = "mysql://usuario:secreto-falso@servicio-falso.ejemplo-cloud.invalid:12345/base";

test("fuera de produccion con una base remota: no arranca y no crea el pool", () => {
  expect(() => cargarDb({ NODE_ENV: "development", DATABASE_URL: URL_REMOTA })).toThrow(/Me niego a arrancar/);
  expect(mockCrearPool).not.toHaveBeenCalled();
});

test("el error de arranque no filtra la clave de la base", () => {
  let mensaje = "";
  try {
    cargarDb({ NODE_ENV: "development", DATABASE_URL: URL_REMOTA });
  } catch (error) {
    mensaje = error.message;
  }
  expect(mensaje).not.toContain("secreto-falso");
});

test("sin NODE_ENV tambien cuenta como desarrollo y rechaza una base remota", () => {
  expect(() => cargarDb({ NODE_ENV: undefined, DATABASE_URL: URL_REMOTA })).toThrow(/Me niego a arrancar/);
  expect(mockCrearPool).not.toHaveBeenCalled();
});

test("base local: crea el pool sin tls", () => {
  cargarDb({ NODE_ENV: "development", DATABASE_URL: "mysql://tucompra_dev:x@127.0.0.1:3306/tucompra_dev" });

  const opciones = mockCrearPool.mock.calls[0][0];
  expect(opciones.uri).toContain("127.0.0.1");
  expect(opciones).not.toHaveProperty("ssl");
});

test("host remoto permitido a proposito: se conecta con tls como siempre", () => {
  cargarDb({
    NODE_ENV: "development",
    DATABASE_URL: URL_REMOTA,
    DB_HOSTS_PERMITIDOS: "servicio-falso.ejemplo-cloud.invalid",
  });

  expect(mockCrearPool.mock.calls[0][0].ssl).toEqual({ rejectUnauthorized: false });
});

test("produccion: no valida el host y conserva el tls actual", () => {
  cargarDb({ NODE_ENV: "production", DATABASE_URL: URL_REMOTA });

  expect(mockCrearPool).toHaveBeenCalledTimes(1);
  expect(mockCrearPool.mock.calls[0][0].ssl).toEqual({ rejectUnauthorized: false });
});
