const { hashearPassword, verificarPassword, esHashValido, PARAMETROS } = require("./auth.hash");

describe("hashearPassword", () => {
  test("guarda los parametros y la sal dentro del string, sin la contrasena", async () => {
    const hash = await hashearPassword("clave-de-prueba-123");
    const [algoritmo, N, r, p, sal, derivado] = hash.split("$");

    expect(algoritmo).toBe("scrypt");
    expect([Number(N), Number(r), Number(p)]).toEqual([PARAMETROS.N, PARAMETROS.r, PARAMETROS.p]);
    expect(sal).toMatch(/^[0-9a-f]{32}$/);
    expect(derivado).toMatch(/^[0-9a-f]{128}$/);
    expect(hash).not.toContain("clave-de-prueba-123");
  });

  test("usa los valores por defecto de node (N=16384, r=8, p=1)", () => {
    expect(PARAMETROS).toEqual({ N: 16384, r: 8, p: 1 });
  });

  test("la sal es distinta en cada llamada: dos hashes de la misma clave no coinciden", async () => {
    const [a, b] = await Promise.all([hashearPassword("misma-clave-123"), hashearPassword("misma-clave-123")]);
    expect(a).not.toBe(b);
  });

  test("rechaza una contrasena vacia o que no es texto", async () => {
    await expect(hashearPassword("")).rejects.toThrow();
    await expect(hashearPassword(undefined)).rejects.toThrow();
    await expect(hashearPassword(1234)).rejects.toThrow();
  });
});

describe("verificarPassword", () => {
  test("acepta la contrasena correcta y rechaza las incorrectas", async () => {
    const hash = await hashearPassword("clave-correcta-123");

    expect(await verificarPassword("clave-correcta-123", hash)).toBe(true);
    expect(await verificarPassword("clave-correcta-124", hash)).toBe(false);
    expect(await verificarPassword("", hash)).toBe(false);
    expect(await verificarPassword("CLAVE-CORRECTA-123", hash)).toBe(false);
  });

  test("un hash alterado no valida", async () => {
    const hash = await hashearPassword("clave-correcta-123");
    const alterado = hash.slice(0, -1) + (hash.endsWith("0") ? "1" : "0");

    expect(await verificarPassword("clave-correcta-123", alterado)).toBe(false);
  });

  test("lee los parametros del propio hash: uno hecho con N distinto sigue validando", async () => {
    const hash = await hashearPassword("clave-correcta-123", { N: 1024, r: 8, p: 1 });

    expect(hash.startsWith("scrypt$1024$8$1$")).toBe(true);
    expect(await verificarPassword("clave-correcta-123", hash)).toBe(true);
    expect(await verificarPassword("otra", hash)).toBe(false);
  });

  test.each([undefined, null, "", "texto-plano", "scrypt$1$2$3", "bcrypt$x$y", 42, {}])(
    "un almacenado invalido (%p) da false sin lanzar",
    async (almacenado) => {
      await expect(verificarPassword("clave", almacenado)).resolves.toBe(false);
    }
  );

  test("una contrasena que no es texto da false", async () => {
    const hash = await hashearPassword("clave-correcta-123");
    expect(await verificarPassword(undefined, hash)).toBe(false);
    expect(await verificarPassword(null, hash)).toBe(false);
    expect(await verificarPassword({}, hash)).toBe(false);
  });
});

describe("esHashValido", () => {
  test("reconoce un hash generado y rechaza el resto", async () => {
    expect(esHashValido(await hashearPassword("clave-correcta-123"))).toBe(true);
    expect(esHashValido("clave123")).toBe(false);
    expect(esHashValido("scrypt$1000$8$1$aabbccddeeff00112233445566778899$" + "ab".repeat(32))).toBe(false); // N no es potencia de 2
    expect(esHashValido("scrypt$16384$8$1$aa$bb")).toBe(false); // sal y hash demasiado cortos
    expect(esHashValido(undefined)).toBe(false);
  });
});
