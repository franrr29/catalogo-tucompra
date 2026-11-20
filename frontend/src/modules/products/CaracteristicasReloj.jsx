// unico lugar donde se define el bloque que comparten todos los relojes
const CARACTERISTICAS = [
  ["💡", "Reloj con luz LED"],
  ["⏱️", "Cronómetro"],
  ["⏰", "Alarma"],
  ["⏳", "Temporizador"],
  ["🌍", "Distintas zonas horarias de todo el mundo"],
  ["💦", "Resistente a salpicaduras"],
  ["🎁", "Incluye su cajita"],
];

const PROMO = "Llevando 2 unidades, promo con descuento";

// un producto es reloj si su categoria lo dice ("Reloj", "Relojes", sin importar mayusculas)
export function esReloj(producto) {
  return (producto?.categoria || "").toLowerCase().includes("reloj");
}

function CaracteristicasReloj() {
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-1.5 text-sm leading-6 text-[#1A1A1A]">
        {CARACTERISTICAS.map(([emoji, texto]) => (
          <li key={texto} className="flex gap-2">
            <span aria-hidden>{emoji}</span>
            <span>
              <strong>{texto}</strong>
              {texto === "Resistente a salpicaduras" && " (no sumergible)"}
            </span>
          </li>
        ))}
      </ul>

      <p className="flex gap-2 rounded-xl border border-brand/40 bg-oro-suave px-4 py-3 text-sm leading-6 text-ink">
        <span aria-hidden>🔥</span>
        <strong>{PROMO}</strong>
      </p>
    </div>
  );
}

export default CaracteristicasReloj;
