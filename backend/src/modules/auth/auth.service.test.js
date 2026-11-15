// el .env local no debe influir en estos tests: se mockea dotenv para que no cargue ningun archivo
jest.mock("dotenv", () => ({ config: jest.fn() }));

const { hashearPassword } = require("./auth.hash");

const ENTORNO_ORIGINAL = { ...process.env };

// carga auth.service desde cero con las variables indicadas (el aviso de texto plano se muestra una vez por carga)
function cargarServicio(variables) {
  jest.resetModules();
  process.env = { ...ENTORNO_ORIGINAL, SECRET_PASSW: "secreto-de-test", ADMIN_USER: "admin" };
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_PASSWORD_HASH;
  Object.assign(process.env, variables);
  return require("./auth.service");
}

beforeEach(() => {
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  process.env = { ...ENTORNO_ORIGINAL };
  jest.restoreAllMocks();
});

describe("con ADMIN_PASSWORD_HASH", () => {
  let hash;
  beforeAll(async () => {
    hash = await hashearPassword("clave-del-admin-123");
  });

  test("usuario y clave correctos devuelven un token", async () => {
    const { iniciarSesion } = cargarServicio({ ADMIN_PASSWORD_HASH: hash });
    const token = await iniciarSesion("admin", "clave-del-admin-123");
    expect(typeof token).toBe("string");
    expect(console.warn).not.toHaveBeenCalled();
  });

  test.each([
    ["clave incorrecta", "admin", "otra-clave"],
    ["usuario incorrecto", "root", "clave-del-admin-123"],
    ["ambos incorrectos", "root", "otra-clave"],
    ["clave vacia", "admin", ""],
    ["sin clave", "admin", undefined],
    ["sin usuario", undefined, "clave-del-admin-123"],
    ["clave que no es texto", "admin", { $ne: "" }],
  ])("%s: 401", async (_, usuario, clave) => {
    const { iniciarSesion } = cargarServicio({ ADMIN_PASSWORD_HASH: hash });
    await expect(iniciarSesion(usuario, clave)).rejects.toMatchObject({ status: 401 });
  });

  test("el hash manda: la contrasena vieja en texto plano deja de servir", async () => {
    const { iniciarSesion } = cargarServicio({ ADMIN_PASSWORD_HASH: hash, ADMIN_PASSWORD: "vieja-clave-plana" });

    await expect(iniciarSesion("admin", "vieja-clave-plana")).rejects.toMatchObject({ status: 401 });
    await expect(iniciarSesion("admin", "clave-del-admin-123")).resolves.toEqual(expect.any(String));
  });
});

describe("migracion: sin hash, con ADMIN_PASSWORD en texto plano", () => {
  test("sigue funcionando (no deja afuera del panel) y avisa una sola vez", async () => {
    const { iniciarSesion } = cargarServicio({ ADMIN_PASSWORD: "clave-plana-123" });

    await expect(iniciarSesion("admin", "clave-plana-123")).resolves.toEqual(expect.any(String));
    await expect(iniciarSesion("admin", "mala")).rejects.toMatchObject({ status: 401 });
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn.mock.calls[0][0]).toContain("ADMIN_PASSWORD_HASH");
    expect(console.warn.mock.calls[0][0]).not.toContain("clave-plana-123");
  });

  test("un ADMIN_PASSWORD_HASH mal formado cae al texto plano con aviso, en vez de dejar sin acceso", async () => {
    const { iniciarSesion } = cargarServicio({ ADMIN_PASSWORD_HASH: "esto-no-es-un-hash", ADMIN_PASSWORD: "clave-plana-123" });

    await expect(iniciarSesion("admin", "clave-plana-123")).resolves.toEqual(expect.any(String));
    expect(console.warn.mock.calls[0][0]).toContain("formato");
  });
});

describe("sin ninguna contrasena configurada", () => {
  test("es un error de configuracion (500), no de credenciales", async () => {
    const { iniciarSesion } = cargarServicio({});
    await expect(iniciarSesion("admin", "lo-que-sea")).rejects.toMatchObject({ status: 500 });
  });

  test("un hash mal formado y sin texto plano tambien es un error de configuracion", async () => {
    const { iniciarSesion } = cargarServicio({ ADMIN_PASSWORD_HASH: "basura" });
    await expect(iniciarSesion("admin", "lo-que-sea")).rejects.toMatchObject({ status: 500 });
  });
});
