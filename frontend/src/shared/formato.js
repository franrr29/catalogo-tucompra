// formatea un numero como precio: 12500 -> "$12.500"
export function formatearPrecio(valor) {
  const numero = parseFloat(valor);
  return `$${(isNaN(numero) ? 0 : numero).toLocaleString("es-UY")}`;
}
