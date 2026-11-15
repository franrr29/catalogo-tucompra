// hash de contrasenas con scrypt, que viene en el modulo crypto de node (sin dependencias nuevas).
// formato guardado: scrypt$N$r$p$sal(hex)$hash(hex). los parametros viajan dentro del string, asi se pueden
// subir mas adelante sin invalidar los hashes que ya existen
const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);

// los valores por defecto de node (N=16384, r=8, p=1): con ellos no hace falta ajustar maxmem
const PARAMETROS = { N: 16384, r: 8, p: 1 };
const LARGO_SAL = 16;
const LARGO_HASH = 64;
const FORMATO = /^scrypt\$(\d+)\$(\d+)\$(\d+)\$([0-9a-f]+)\$([0-9a-f]+)$/;

// scrypt necesita unos 128 * N * r bytes; node trae 32 MB de tope, suficiente para los valores por defecto.
// si algun dia se suben N o r, el tope se sube con ellos para que verificar un hash nuevo no falle
function memoriaMaxima({ N, r }) {
  return Math.max(32 * 1024 * 1024, 192 * N * r);
}

async function derivar(password, sal, { N, r, p }, largo) {
  return scrypt(password, sal, largo, { N, r, p, maxmem: memoriaMaxima({ N, r }) });
}

// devuelve el string a guardar en ADMIN_PASSWORD_HASH
async function hashearPassword(password, parametros = PARAMETROS) {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("la contrasena debe ser un texto no vacio");
  }
  const sal = crypto.randomBytes(LARGO_SAL);
  const hash = await derivar(password, sal, parametros, LARGO_HASH);
  return ["scrypt", parametros.N, parametros.r, parametros.p, sal.toString("hex"), hash.toString("hex")].join("$");
}

// true si el string tiene la forma de un hash generado por hashearPassword (no comprueba ninguna contrasena)
function esHashValido(almacenado) {
  if (typeof almacenado !== "string") return false;
  const partes = FORMATO.exec(almacenado.trim());
  if (!partes) return false;
  const [N, r, p] = [partes[1], partes[2], partes[3]].map(Number);
  // N debe ser potencia de 2 y todo debe ser positivo
  return N >= 2 && (N & (N - 1)) === 0 && r > 0 && p > 0 && partes[4].length >= 16 && partes[5].length >= 32;
}

// compara en tiempo constante. cualquier entrada que no sirva da false (nunca lanza por una contrasena rara)
async function verificarPassword(password, almacenado) {
  if (typeof password !== "string" || !esHashValido(almacenado)) return false;

  const [, N, r, p, salHex, hashHex] = FORMATO.exec(almacenado.trim());
  const esperado = Buffer.from(hashHex, "hex");
  const calculado = await derivar(password, Buffer.from(salHex, "hex"), { N: Number(N), r: Number(r), p: Number(p) }, esperado.length);

  return crypto.timingSafeEqual(calculado, esperado);
}

module.exports = { hashearPassword, verificarPassword, esHashValido, PARAMETROS };
