// utilidades de costo y margen del panel. null/undefined/"" significan "costo desconocido": nunca se asume 0

// numero o null; el texto vacio y los valores no numericos son null
export function aNumero(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "string" && valor.trim() === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

// costo como texto para el campo del formulario ("" cuando no esta cargado)
export function costoComoTexto(costo) {
  const numero = aNumero(costo);
  return numero === null ? "" : String(numero);
}

// dos costos son iguales si son el mismo numero, o si los dos estan sin cargar
export function mismoCosto(a, b) {
  return aNumero(a) === aNumero(b);
}

// ganancia por unidad y porcentaje sobre el precio; null si falta el precio o el costo (sin dato)
export function calcularMargen(precio, costo) {
  const p = aNumero(precio);
  const c = aNumero(costo);
  if (p === null || c === null) return null;
  const ganancia = Math.round((p - c) * 100) / 100;
  return { ganancia, porcentaje: p > 0 ? Math.round(((p - c) / p) * 1000) / 10 : null };
}

// advertencia (no bloquea): el costo supera al precio, se vendería con perdida
export function costoMayorQuePrecio(costo, precio) {
  const c = aNumero(costo);
  const p = aNumero(precio);
  return c !== null && p !== null && c > p;
}

// el costo ingresado no es valido si no es un numero mayor o igual a 0 (vacio es valido: costo desconocido)
export function costoInvalido(costo) {
  if (typeof costo === "string" && costo.trim() === "") return false;
  const numero = aNumero(costo);
  return numero === null || numero < 0;
}

// parametro ?editar= de la url: solo enteros positivos; cualquier otra cosa se ignora (null)
export function leerIdEditar(valor) {
  if (typeof valor !== "string" || !/^[1-9]\d*$/.test(valor)) return null;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) ? numero : null;
}
