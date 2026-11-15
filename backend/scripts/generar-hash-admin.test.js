// el script se corre como proceso aparte con la clave por stdin (entrada que no es una terminal)
const { spawnSync } = require("child_process");
const path = require("path");
const { verificarPassword, esHashValido } = require("../src/modules/auth/auth.hash");

function correr(entrada) {
  return spawnSync(process.execPath, [path.join(__dirname, "generar-hash-admin.js")], {
    input: entrada,
    encoding: "utf8",
    timeout: 20000,
  });
}

test("imprime solo el hash por stdout y valida con la contrasena", async () => {
  const resultado = correr("una-clave-larga-de-prueba\n");

  expect(resultado.status).toBe(0);
  const hash = resultado.stdout.trim();
  expect(esHashValido(hash)).toBe(true);
  expect(await verificarPassword("una-clave-larga-de-prueba", hash)).toBe(true);
  // la contrasena no aparece en ninguna salida
  expect(resultado.stdout).not.toContain("una-clave-larga-de-prueba");
  expect(resultado.stderr).not.toContain("una-clave-larga-de-prueba");
});

test("rechaza una contrasena demasiado corta", () => {
  const resultado = correr("corta\n");

  expect(resultado.status).toBe(1);
  expect(resultado.stdout).toBe("");
});
