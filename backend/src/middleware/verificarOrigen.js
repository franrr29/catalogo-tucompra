// proteccion contra CSRF: la cookie de sesion es sameSite=none (el front y el back viven en dominios distintos), asi que
// el navegador la manda tambien desde otros sitios. en cualquier peticion que modifica datos se exige un header Origin
// que este en una lista estricta: solo el frontend. sin Origin tambien se rechaza (los navegadores siempre lo mandan
// en POST/PUT/PATCH/DELETE; si falta, no es un navegador cumpliendo las reglas)

const METODOS_SEGUROS = ["GET", "HEAD", "OPTIONS"];

// deja un origen en su forma canonica (esquema://host[:puerto], sin barra final ni ruta). null si no sirve.
// no hay comodines: un valor con "*" o sin http/https se descarta
function normalizarOrigen(valor) {
  if (typeof valor !== "string" || valor.includes("*")) return null;
  try {
    const url = new URL(valor.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

// FRONTEND_URL (el mismo origen que usa el CORS) mas, si hace falta, ORIGENES_PERMITIDOS: lista separada por comas
function leerOrigenesPermitidos(entorno = process.env) {
  const crudos = [entorno.FRONTEND_URL, ...String(entorno.ORIGENES_PERMITIDOS || "").split(",")];
  return new Set(crudos.map(normalizarOrigen).filter(Boolean));
}

// true si la peticion puede modificar datos desde ese origen
function origenPermitido(req, entorno = process.env) {
  if (METODOS_SEGUROS.includes(req.method)) return true;

  const origen = normalizarOrigen(req.get("Origin"));
  if (origen === null) return false;
  return leerOrigenesPermitidos(entorno).has(origen);
}

module.exports = { origenPermitido, normalizarOrigen, leerOrigenesPermitidos };
