// genera el hash scrypt de la contrasena del admin para cargarlo en ADMIN_PASSWORD_HASH.
// uso (desde backend/): node scripts/generar-hash-admin.js
// la contrasena se pide por la terminal SIN mostrarla (no se pasa como argumento: quedaria en el historial)
// y se escribe solo el hash en la salida. no toca ninguna base de datos ni archivo.
const { hashearPassword } = require("../src/modules/auth/auth.hash");

const LARGO_MINIMO = 10;

// pide un texto sin hacer eco. si la entrada no es una terminal (por ejemplo una tuberia) lee una linea de stdin
function pedirOculto(pregunta) {
  return new Promise((resolver, rechazar) => {
    const entrada = process.stdin;
    process.stderr.write(pregunta);

    if (!entrada.isTTY) {
      let datos = "";
      entrada.setEncoding("utf8");
      entrada.on("data", (trozo) => (datos += trozo));
      entrada.on("end", () => resolver(datos.split(/\r?\n/)[0]));
      entrada.on("error", rechazar);
      return;
    }

    let texto = "";
    entrada.setRawMode(true);
    entrada.resume();
    entrada.setEncoding("utf8");

    const alTecla = (tecla) => {
      for (const caracter of tecla) {
        if (caracter === "\u0003") {
          // ctrl+c
          entrada.setRawMode(false);
          process.stderr.write("\n");
          process.exit(130);
        } else if (caracter === "\r" || caracter === "\n" || caracter === "\u0004") {
          entrada.setRawMode(false);
          entrada.pause();
          entrada.removeListener("data", alTecla);
          process.stderr.write("\n");
          return resolver(texto);
        } else if (caracter === "\u007f" || caracter === "\b") {
          texto = texto.slice(0, -1);
        } else {
          texto += caracter;
        }
      }
    };

    entrada.on("data", alTecla);
  });
}

async function main() {
  const clave = await pedirOculto("Contrasena nueva del admin: ");

  if (clave.length < LARGO_MINIMO) {
    console.error(`la contrasena debe tener al menos ${LARGO_MINIMO} caracteres`);
    process.exit(1);
  }

  if (process.stdin.isTTY) {
    const repetida = await pedirOculto("Repetila para confirmar: ");
    if (repetida !== clave) {
      console.error("las contrasenas no coinciden");
      process.exit(1);
    }
  }

  // solo el hash va a stdout: se puede copiar tal cual a ADMIN_PASSWORD_HASH
  console.log(await hashearPassword(clave));
  process.stderr.write("Copia la linea de arriba en la variable ADMIN_PASSWORD_HASH (Render y tu .env local).\n");
}

main().catch((error) => {
  console.error("no se pudo generar el hash:", error.message);
  process.exit(1);
});
