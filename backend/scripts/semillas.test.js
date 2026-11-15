// el script se ejecuta como proceso aparte con entornos de mentira: en ningun caso llega a conectarse a una base
const { spawnSync } = require("child_process");
const path = require("path");

function correr(entorno) {
  return spawnSync(process.execPath, [path.join(__dirname, "semillas.js")], {
    env: { PATH: process.env.PATH, ...entorno },
    encoding: "utf8",
    timeout: 20000,
  });
}

test("con NODE_ENV=production se niega a correr", () => {
  const resultado = correr({
    NODE_ENV: "production",
    DATABASE_URL: "mysql://u:secreto-falso@servicio-falso.ejemplo-cloud.invalid:12345/base",
  });
  expect(resultado.status).toBe(1);
  expect(resultado.stderr).toContain("no se ejecuta con NODE_ENV=production");
});

test("fuera de produccion con una base remota: db.js se niega a arrancar y no hay conexion", () => {
  const resultado = correr({
    NODE_ENV: "development",
    DATABASE_URL: "mysql://u:secreto-falso@servicio-falso.ejemplo-cloud.invalid:12345/base",
  });
  expect(resultado.status).not.toBe(0);
  expect(resultado.stderr).toContain("Me niego a arrancar");
  expect(resultado.stderr).not.toContain("secreto-falso");
});
