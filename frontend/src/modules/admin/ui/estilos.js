// clases de Tailwind del panel de administracion, en un solo lugar
// los colores, radios y sombras salen de los tokens de tailwind.config.js (oro, superficie, linea, campo, tarjeta, control)
// solo presentacion: las paginas usan estas constantes en su className sin cambiar el marcado ni los manejadores

// anillo de foco dorado visible solo con teclado
const foco =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-oro-acento focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

// las transiciones de interaccion duran 150 ms y se apagan con prefers-reduced-motion
const transicion = "transition-colors duration-150 motion-reduce:transition-none";

const botonBase = `inline-flex items-center justify-center gap-2 rounded-control px-4 py-2.5 text-sm font-semibold ${transicion} ${foco} disabled:opacity-50 disabled:cursor-not-allowed`;

export const boton = {
  // accion principal: oscuro, y dorado oscuro al pasar el mouse (texto paper sobre oro.texto: 4.98:1)
  primario: `${botonBase} bg-ink text-paper hover:bg-oro-texto`,
  secundario: `${botonBase} border border-campo bg-superficie text-ink hover:border-ink hover:bg-paper`,
  peligro: `${botonBase} border border-red-300 bg-superficie text-red-700 hover:bg-red-50`,
  // boton chico para acciones dentro de filas y paneles
  chico: "px-3 py-2 text-xs",
};

// filtros en forma de pildora (Pagados, Pendientes, ...)
const pildoraBase = `inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold ${transicion} ${foco}`;
export const filtro = {
  activo: `${pildoraBase} border-ink bg-ink text-paper`,
  inactivo: `${pildoraBase} border-campo bg-superficie text-ink hover:border-ink`,
};

// campos de formulario: redondeados, con anillo dorado al enfocar
export const campo = `w-full rounded-control border border-campo bg-superficie px-4 py-3 text-sm text-ink placeholder:text-muted ${transicion} focus:outline-none focus:border-oro-acento focus:ring-2 focus:ring-oro-acento/40`;

// etiqueta pequena en mayuscula, con poco tracking para que se lea bien
export const etiqueta = "text-xs font-semibold uppercase tracking-[0.06em] text-muted";

// texto secundario y de ayuda
export const textoSecundario = "text-sm text-muted";

// filas de listas y tablas
export const fila = {
  contenedor: "rounded-2xl border border-linea bg-superficie overflow-hidden",
  boton: `w-full text-left px-4 py-3.5 text-sm ${transicion} hover:bg-paper ${foco} focus-visible:ring-inset focus-visible:ring-offset-0`,
  detalle: "border-t border-linea bg-paper/60 px-4 py-5 sm:px-6",
  encabezado: "hidden sm:grid px-4 text-xs font-semibold uppercase tracking-[0.06em] text-muted",
};

// aviso de confirmacion (guardado correcto) y de error
export const aviso = {
  exito: "rounded-control border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800",
  error: "text-sm text-red-700",
};

// links de acciones secundarias dentro de paneles
export const enlace = `text-xs font-semibold uppercase tracking-[0.06em] text-muted underline underline-offset-2 hover:text-ink ${transicion} ${foco}`;
