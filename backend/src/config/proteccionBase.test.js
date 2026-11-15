const { verificarBaseSegura, hostDeUrl, esHostLocal } = require("./proteccionBase");

// url ficticia con forma de base remota de un proveedor cloud: no es ningun host real
const URL_REMOTA = "mysql://usuario:secreto-falso@servicio-falso.ejemplo-cloud.invalid:12345/base";
const URL_LOCAL = "mysql://tucompra_dev:clave@127.0.0.1:3306/tucompra_dev";

describe("hostDeUrl", () => {
  test("extrae el host sin usuario ni clave", () => {
    expect(hostDeUrl(URL_REMOTA)).toBe("servicio-falso.ejemplo-cloud.invalid");
    expect(hostDeUrl("mysql://u:p@LOCALHOST/db")).toBe("localhost");
  });

  test("quita los corchetes de ipv6", () => {
    expect(hostDeUrl("mysql://u:p@[::1]:3306/db")).toBe("::1");
  });

  test("una url invalida devuelve null", () => {
    expect(hostDeUrl("esto no es una url")).toBeNull();
  });
});

describe("esHostLocal", () => {
  test("solo loopback", () => {
    expect(esHostLocal("localhost")).toBe(true);
    expect(esHostLocal("127.0.0.1")).toBe(true);
    expect(esHostLocal("::1")).toBe(true);
    expect(esHostLocal("localhost.evil.com")).toBe(false);
    expect(esHostLocal("127.0.0.1.evil.com")).toBe(false);
  });
});

describe("verificarBaseSegura fuera de produccion", () => {
  test.each(["development", "test", undefined])("acepta una base local con NODE_ENV=%s", (nodeEnv) => {
    expect(() => verificarBaseSegura(URL_LOCAL, { NODE_ENV: nodeEnv })).not.toThrow();
    expect(() => verificarBaseSegura("mysql://u:p@localhost/db", { NODE_ENV: nodeEnv })).not.toThrow();
    expect(() => verificarBaseSegura("mysql://u:p@[::1]/db", { NODE_ENV: nodeEnv })).not.toThrow();
  });

  test.each(["development", "test", undefined, "staging"])("rechaza un host remoto con NODE_ENV=%s", (nodeEnv) => {
    expect(() => verificarBaseSegura(URL_REMOTA, { NODE_ENV: nodeEnv })).toThrow(/Me niego a arrancar/);
  });

  test("el error nombra el host pero nunca la clave ni el usuario", () => {
    let mensaje = "";
    try {
      verificarBaseSegura(URL_REMOTA, { NODE_ENV: "development" });
    } catch (error) {
      mensaje = error.message;
    }
    expect(mensaje).toContain("servicio-falso.ejemplo-cloud.invalid");
    expect(mensaje).not.toContain("secreto-falso");
    expect(mensaje).not.toContain("usuario");
  });

  test("rechaza un host que solo se parece a uno local", () => {
    expect(() => verificarBaseSegura("mysql://u:p@localhost.evil.com/db", { NODE_ENV: "development" })).toThrow();
    expect(() => verificarBaseSegura("mysql://u:p@127.0.0.1.evil.com/db", { NODE_ENV: "development" })).toThrow();
  });

  test("sin DATABASE_URL o con una url invalida falla con un mensaje claro", () => {
    expect(() => verificarBaseSegura(undefined, { NODE_ENV: "development" })).toThrow(/DATABASE_URL no esta definida/);
    expect(() => verificarBaseSegura("", { NODE_ENV: "development" })).toThrow(/DATABASE_URL no esta definida/);
    expect(() => verificarBaseSegura("no es url", { NODE_ENV: "development" })).toThrow(/no es una url valida/);
  });

  test("DB_HOSTS_PERMITIDOS habilita hosts remotos concretos, sin comodines", () => {
    const entorno = { NODE_ENV: "development", DB_HOSTS_PERMITIDOS: " otro.ejemplo.invalid , Servicio-Falso.ejemplo-cloud.invalid " };
    expect(() => verificarBaseSegura(URL_REMOTA, entorno)).not.toThrow();
    expect(() => verificarBaseSegura("mysql://u:p@no-listado.ejemplo.invalid/db", entorno)).toThrow();
    expect(() =>
      verificarBaseSegura(URL_REMOTA, { NODE_ENV: "development", DB_HOSTS_PERMITIDOS: "*" })
    ).toThrow();
  });

  test("DB_HOST_PRODUCCION se rechaza siempre, incluso si esta en DB_HOSTS_PERMITIDOS", () => {
    const host = "servicio-falso.ejemplo-cloud.invalid";
    expect(() =>
      verificarBaseSegura(URL_REMOTA, { NODE_ENV: "development", DB_HOST_PRODUCCION: host, DB_HOSTS_PERMITIDOS: host })
    ).toThrow(/host de produccion/);
  });
});

describe("verificarBaseSegura en produccion", () => {
  test("no valida nada", () => {
    expect(() => verificarBaseSegura(URL_REMOTA, { NODE_ENV: "production" })).not.toThrow();
    expect(() => verificarBaseSegura(undefined, { NODE_ENV: "production" })).not.toThrow();
  });
});
