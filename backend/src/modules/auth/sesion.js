// duracion de la sesion del admin. hay dos limites:
//  - inactividad: cada request autenticada renueva el token por 1 hora mas (como antes)
//  - duracion absoluta: pase lo que pase, la sesion termina SESION_MAX_HORAS despues del login (12 por defecto);
//    el instante del login viaja en el claim "inicio" del token y las renovaciones lo conservan
const INACTIVIDAD_SEGUNDOS = 60 * 60;
const SESION_MAX_HORAS_DEFECTO = 12;

// SESION_MAX_HORAS: numero positivo (admite decimales, por ejemplo 0.5); si falta o no sirve, 12
function leerSesionMaxHoras(valor = process.env.SESION_MAX_HORAS) {
  const texto = String(valor ?? "").trim();
  if (!/^\d+(\.\d+)?$/.test(texto)) return SESION_MAX_HORAS_DEFECTO;
  const horas = Number(texto);
  return Number.isFinite(horas) && horas > 0 ? horas : SESION_MAX_HORAS_DEFECTO;
}

const ahoraEnSegundos = () => Math.floor(Date.now() / 1000);

// segundos que le quedan a una sesion que empezo en "inicio" (negativo o cero = ya vencio)
function segundosRestantes(inicio, ahora = ahoraEnSegundos(), maxHoras = leerSesionMaxHoras()) {
  return Math.floor(inicio + maxHoras * 3600 - ahora);
}

// cuanto dura el proximo token: la inactividad (1 h), pero nunca mas de lo que queda de sesion
function duracionDelToken(restante) {
  return Math.max(1, Math.min(INACTIVIDAD_SEGUNDOS, restante));
}

// instante en que empezo la sesion segun el token. los tokens emitidos antes de este cambio no traen "inicio":
// se usa su iat (la ultima renovacion), asi nadie queda afuera al desplegar
function inicioDeSesion(datos) {
  if (Number.isFinite(datos.inicio)) return datos.inicio;
  return Number.isFinite(datos.iat) ? datos.iat : 0;
}

module.exports = {
  leerSesionMaxHoras,
  segundosRestantes,
  duracionDelToken,
  inicioDeSesion,
  ahoraEnSegundos,
  INACTIVIDAD_SEGUNDOS,
  SESION_MAX_HORAS_DEFECTO,
};
