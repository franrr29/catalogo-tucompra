// impide que un entorno que no es produccion se conecte a una base remota por error.
// es una lista de permitidos: no hace falta conocer (ni escribir en el repo) el host de produccion

const HOSTS_LOCALES = ["localhost", "127.0.0.1", "::1"];

// host de la url de la base, en minusculas y sin corchetes (los de ipv6). nunca devuelve usuario ni clave.
// usa el mismo parser de urls que mysql2, asi ve el mismo host que usaria la conexion
function hostDeUrl(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^\[|\]$/g, "");
  } catch {
    return null;
  }
}

function esHostLocal(host) {
  return HOSTS_LOCALES.includes(host);
}

// lista separada por comas, sin vacios y en minusculas
function leerLista(valor) {
  return String(valor || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

// lanza un error claro si la base configurada no es segura para este entorno; en produccion no valida nada.
// los mensajes incluyen el host pero nunca la url completa
function verificarBaseSegura(url, entorno = process.env) {
  if (entorno.NODE_ENV === "production") return;

  if (!url) {
    throw new Error(
      "DATABASE_URL no esta definida. Copia backend/.env.example a backend/.env y apunta a la base local de desarrollo."
    );
  }

  const host = hostDeUrl(url);
  if (!host) {
    throw new Error("DATABASE_URL no es una url valida (se esperaba mysql://usuario:clave@host:puerto/base).");
  }

  const hostProduccion = String(entorno.DB_HOST_PRODUCCION || "").trim().toLowerCase();
  if (hostProduccion && host === hostProduccion) {
    throw new Error(
      `Me niego a arrancar: la base apunta al host de produccion (${host}) y NODE_ENV no es "production". ` +
        "Usa la base local de desarrollo en backend/.env."
    );
  }

  const permitidos = [...HOSTS_LOCALES, ...leerLista(entorno.DB_HOSTS_PERMITIDOS)];
  if (!permitidos.includes(host)) {
    throw new Error(
      `Me niego a arrancar: la base apunta a "${host}", que no es local, y NODE_ENV no es "production". ` +
        "Usa la base de desarrollo (localhost) en backend/.env. Si ese host remoto es intencional, " +
        "agregalo a DB_HOSTS_PERMITIDOS en tu .env local."
    );
  }
}

module.exports = { verificarBaseSegura, hostDeUrl, esHostLocal, HOSTS_LOCALES };
