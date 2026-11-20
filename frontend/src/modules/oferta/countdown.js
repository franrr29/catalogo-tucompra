// 5 dias y 2 horas
export const DURACION_OFERTA_MS = (5 * 24 + 2) * 60 * 60 * 1000;

const CLAVE_FIN_OFERTA = "ofertaNavidadFin";

const MS_POR_SEGUNDO = 1000;
const MS_POR_MINUTO = 60 * MS_POR_SEGUNDO;
const MS_POR_HORA = 60 * MS_POR_MINUTO;
const MS_POR_DIA = 24 * MS_POR_HORA;

// tiempo que falta hasta endTime (ms desde epoch); nunca devuelve negativos
export function getTimeLeft(endTime, now) {
  const restante = Math.max(0, endTime - now);
  return {
    days: Math.floor(restante / MS_POR_DIA),
    hours: Math.floor((restante % MS_POR_DIA) / MS_POR_HORA),
    minutes: Math.floor((restante % MS_POR_HORA) / MS_POR_MINUTO),
    seconds: Math.floor((restante % MS_POR_MINUTO) / MS_POR_SEGUNDO),
    isExpired: restante === 0,
  };
}

// la fecha final se guarda la primera vez para que no se reinicie al recargar
export function obtenerFechaFinOferta(ahora = Date.now()) {
  try {
    const guardada = Number(localStorage.getItem(CLAVE_FIN_OFERTA));
    if (Number.isFinite(guardada) && guardada > 0) return guardada;
  } catch {
    // sin localStorage (modo privado, etc.): se usa una fecha en memoria
  }

  const fin = ahora + DURACION_OFERTA_MS;
  try {
    localStorage.setItem(CLAVE_FIN_OFERTA, String(fin));
  } catch {
    // no se pudo guardar: la oferta se reinicia al recargar, pero la pagina funciona
  }
  return fin;
}
