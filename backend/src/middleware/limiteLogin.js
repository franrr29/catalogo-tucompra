// limita los intentos de login por ip para frenar la fuerza bruta.
// el almacenamiento es un Map en memoria: render corre UNA sola instancia, asi que no hay estado que compartir y no
// hace falta redis ni la base. el limite: se pierde al reiniciar o al dormirse la instancia (es un freno, no una garantia)

const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;
// tope de ips recordadas, para que un atacante que rote ips no llene la memoria
const MAX_ENTRADAS = 10000;

function crearLimitador({ maxIntentos = MAX_INTENTOS, ventanaMs = VENTANA_MS, maxEntradas = MAX_ENTRADAS, ahora = Date.now } = {}) {
  // ip -> { intentos, desde }: ventana fija que empieza con el primer intento
  const registros = new Map();

  // borra las entradas vencidas y, si sigue lleno, las mas viejas
  function purgar() {
    const instante = ahora();
    for (const [ip, registro] of registros) {
      if (instante - registro.desde >= ventanaMs) registros.delete(ip);
    }
    while (registros.size >= maxEntradas) {
      registros.delete(registros.keys().next().value);
    }
  }

  function middleware(req, res, next) {
    const ip = req.ip || "desconocida";
    const instante = ahora();

    let registro = registros.get(ip);
    if (registro && instante - registro.desde >= ventanaMs) {
      registros.delete(ip);
      registro = undefined;
    }

    if (!registro) {
      if (registros.size >= maxEntradas) purgar();
      registro = { intentos: 0, desde: instante };
      registros.set(ip, registro);
    }

    // el intento se cuenta ANTES de resolverlo: asi las peticiones en paralelo tampoco se pasan del limite
    registro.intentos += 1;

    if (registro.intentos > maxIntentos) {
      const segundos = Math.max(1, Math.ceil((registro.desde + ventanaMs - instante) / 1000));
      res.set("Retry-After", String(segundos));
      return res.status(429).json({
        mensaje: `demasiados intentos, volve a probar en ${Math.ceil(segundos / 60)} minuto(s)`,
      });
    }

    // un login correcto limpia el contador de esa ip
    res.on("finish", () => {
      if (res.statusCode === 200 && registros.get(ip) === registro) {
        registros.delete(ip);
      }
    });

    next();
  }

  return { middleware, reiniciar: () => registros.clear(), tamano: () => registros.size };
}

// PROXY_SALTOS: cuantos proxies confiables hay delante del backend (entero >= 0). si falta o no sirve, 1 (render)
function leerSaltosDeProxy(valor) {
  const texto = String(valor ?? "").trim();
  return /^\d{1,2}$/.test(texto) ? Number(texto) : 1;
}

const limitador = crearLimitador();

module.exports = { limiteLogin: limitador.middleware, crearLimitador, leerSaltosDeProxy, limitadorLogin: limitador };
