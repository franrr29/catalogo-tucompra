const dosDigitos = (n) => String(n).padStart(2, "0");

// nieve sutil hecha solo con gradientes; se anima unicamente si el usuario no pidio menos movimiento
const NIEVE = {
  backgroundImage:
    "radial-gradient(2px 2px at 20px 30px, #fff, transparent), radial-gradient(2px 2px at 90px 80px, #fff, transparent), radial-gradient(1.5px 1.5px at 150px 20px, #fff, transparent), radial-gradient(1.5px 1.5px at 60px 140px, #fff, transparent)",
  backgroundSize: "180px 180px",
};

function Caja({ valor, etiqueta }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-black/25 px-3 py-2 sm:px-5 sm:py-3 ring-1 ring-amber-300/40 backdrop-blur-sm min-w-[3.5rem] sm:min-w-[5rem]">
      <span className="text-2xl sm:text-4xl font-bold tabular-nums text-amber-300 leading-none">
        {dosDigitos(valor)}
      </span>
      <span className="mt-1 text-[10px] sm:text-xs uppercase tracking-widest text-white/80">
        {etiqueta}
      </span>
    </div>
  );
}

function CuentaRegresiva({ tiempo }) {
  const { days, hours, minutes, seconds, isExpired } = tiempo;
  const descripcion = `Quedan ${days} días, ${hours} horas, ${minutes} minutos y ${seconds} segundos`;

  return (
    <section className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-800 to-emerald-900 text-white h-full ring-1 ring-inset ring-amber-300/50">
      <div aria-hidden className="absolute inset-0 -z-10 opacity-70 motion-safe:animate-nieve" style={NIEVE} />

      <div className="px-6 sm:px-12 py-8 sm:py-10 h-full flex flex-col items-center justify-center gap-3 text-center">
        <span className="text-[11px] uppercase tracking-[0.3em] text-amber-300">🎄 Navidad</span>

        {isExpired ? (
          <h2 className="text-2xl sm:text-3xl font-semibold">Oferta finalizada</h2>
        ) : (
          <>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Oferta por tiempo limitado</h2>
            <div role="timer" aria-label={descripcion} className="flex gap-2 sm:gap-4">
              <Caja valor={days} etiqueta="Días" />
              <Caja valor={hours} etiqueta="Horas" />
              <Caja valor={minutes} etiqueta="Min" />
              <Caja valor={seconds} etiqueta="Seg" />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default CuentaRegresiva;
