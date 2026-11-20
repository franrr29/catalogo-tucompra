import { formatearPrecio } from "../../shared/formato";

function CartResumen({ total, totalArticulos, onWhatsapp, onPagar }) {
  return (
    <aside className="rounded-2xl bg-white/70 border border-border shadow-sm p-6 lg:sticky lg:top-28 flex flex-col gap-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink">Resumen</h2>

      <div className="flex justify-between text-sm text-ink/60">
        <span>{totalArticulos} {totalArticulos === 1 ? "producto" : "productos"}</span>
        <span>{formatearPrecio(total)}</span>
      </div>

      <div className="flex justify-between items-baseline border-t border-border pt-5">
        <span className="text-sm font-medium">Total</span>
        <span className="text-3xl font-semibold tracking-tight">{formatearPrecio(total)}</span>
      </div>

      <button
        onClick={onPagar}
        className="w-full rounded-xl bg-ink-soft hover:bg-brand text-white text-sm font-semibold uppercase tracking-widest py-4 transition-colors"
      >
        Pagar
      </button>
      <button
        onClick={onWhatsapp}
        className="w-full rounded-xl border border-[#25D366] text-[#1a9c4a] hover:bg-[#25D366] hover:text-white text-sm font-semibold uppercase tracking-widest py-3.5 transition-colors"
      >
        Pedir por WhatsApp
      </button>
    </aside>
  );
}

export default CartResumen;
