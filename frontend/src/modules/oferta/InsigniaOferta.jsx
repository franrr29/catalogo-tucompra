// insignia "30% OFF" para la esquina de una tarjeta de producto (solo visual: no toca el precio)
function InsigniaOferta() {
  return (
    <span className="absolute top-3 left-3 z-10 rounded-full bg-gradient-to-br from-red-600 to-red-700 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md ring-1 ring-amber-300/80">
      30% OFF
    </span>
  );
}

export default InsigniaOferta;
