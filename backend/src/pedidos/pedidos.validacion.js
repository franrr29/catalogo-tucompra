const crearError = require("../utils/crearError");

// los 19 departamentos de uruguay, con el nombre exacto que se guarda en la base
const DEPARTAMENTOS = [
  "Artigas",
  "Canelones",
  "Cerro Largo",
  "Colonia",
  "Durazno",
  "Flores",
  "Florida",
  "Lavalleja",
  "Maldonado",
  "Montevideo",
  "Paysandú",
  "Río Negro",
  "Rivera",
  "Rocha",
  "Salto",
  "San José",
  "Soriano",
  "Tacuarembó",
  "Treinta y Tres",
];

const TIPOS_ENTREGA = ["domicilio", "agencia"];

const MAX_COMENTARIO = 300;

// error 400 que ademas indica cual es el campo con problema
function errorDeCampo(campo, mensaje) {
  const error = crearError(mensaje, 400);
  error.campo = campo;
  return error;
}

// texto de una sola linea: sin caracteres de control y con los espacios normalizados
function limpiarLinea(valor) {
  return valor.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
}

// texto obligatorio con largo minimo y maximo
function textoObligatorio(valor, campo, etiqueta, min, max) {
  if (typeof valor !== "string" || !limpiarLinea(valor)) {
    throw errorDeCampo(campo, `${etiqueta} es obligatorio`);
  }
  const limpio = limpiarLinea(valor);
  if (limpio.length < min || limpio.length > max) {
    throw errorDeCampo(campo, `${etiqueta} debe tener entre ${min} y ${max} caracteres`);
  }
  return limpio;
}

// acepta digitos, espacios, guiones, parentesis y un + inicial; guarda solo + (si lo tenia) y digitos
function validarTelefono(valor) {
  if (typeof valor !== "string" || !valor.trim()) {
    throw errorDeCampo("telefono", "el telefono es obligatorio");
  }
  const crudo = valor.trim();
  const digitos = crudo.replace(/\D/g, "");
  if (!/^\+?[\d\s\-().]+$/.test(crudo) || digitos.length < 8 || digitos.length > 15) {
    throw errorDeCampo("telefono", "el telefono no es valido: usa solo numeros, entre 8 y 15 digitos");
  }
  return (crudo.startsWith("+") ? "+" : "") + digitos;
}

// opcional; si viene, solo se valida el formato: entre 6 y 8 digitos (con o sin puntos y guion)
function validarCedula(valor) {
  if (valor === undefined || valor === null || valor === "") return null;
  if (typeof valor !== "string") {
    throw errorDeCampo("cedula", "la cedula no es valida");
  }
  const digitos = valor.replace(/[.\-\s]/g, "");
  if (digitos === "") return null;
  if (!/^\d{6,8}$/.test(digitos)) {
    throw errorDeCampo("cedula", "la cedula no es valida: debe tener entre 6 y 8 digitos");
  }
  return digitos;
}

function validarComentario(valor) {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== "string") {
    throw errorDeCampo("comentario", "el comentario no es valido");
  }
  // se conservan los saltos de linea y se quitan los demas caracteres de control
  const limpio = valor
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    .trim();
  if (limpio.length > MAX_COMENTARIO) {
    throw errorDeCampo("comentario", `el comentario no puede superar los ${MAX_COMENTARIO} caracteres`);
  }
  return limpio === "" ? null : limpio;
}

function validarEnvio(envio) {
  if (!envio || typeof envio !== "object" || Array.isArray(envio)) {
    throw errorDeCampo("envio", "faltan los datos de envio");
  }

  if (!TIPOS_ENTREGA.includes(envio.tipoEntrega)) {
    throw errorDeCampo("tipoEntrega", "el tipo de entrega debe ser envio a domicilio o retiro en agencia");
  }
  const esDomicilio = envio.tipoEntrega === "domicilio";

  const cedula = validarCedula(envio.cedula);

  if (!DEPARTAMENTOS.includes(envio.departamento)) {
    throw errorDeCampo("departamento", "el departamento no es valido");
  }

  const ciudad = textoObligatorio(envio.ciudad, "ciudad", "la ciudad o localidad", 2, 100);

  // la direccion solo se pide con envio a domicilio y la agencia solo con retiro; la que no corresponde se descarta
  const direccion = esDomicilio
    ? textoObligatorio(envio.direccion, "direccion", "la direccion", 5, 200)
    : null;
  const agencia = esDomicilio
    ? null
    : textoObligatorio(envio.agencia, "agencia", "la agencia o sucursal de retiro", 2, 150);

  return {
    tipoEntrega: envio.tipoEntrega,
    cedula,
    departamento: envio.departamento,
    ciudad,
    direccion,
    agencia,
    comentario: validarComentario(envio.comentario),
  };
}

// valida y normaliza los datos del pedido; lanza un error 400 con { message, campo } si algo no sirve
function validarDatosPedido({ nombre, email, telefono, envio }) {
  const nombreLimpio = textoObligatorio(nombre, "nombre", "el nombre de quien recibe", 2, 100);

  const emailLimpio = typeof email === "string" ? email.trim() : "";
  if (!emailLimpio) {
    throw errorDeCampo("email", "el email es obligatorio");
  }
  if (emailLimpio.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
    throw errorDeCampo("email", "el email no es valido");
  }

  return {
    nombre: nombreLimpio,
    email: emailLimpio,
    telefono: validarTelefono(telefono),
    envio: validarEnvio(envio),
  };
}

module.exports = { validarDatosPedido, DEPARTAMENTOS, TIPOS_ENTREGA, MAX_COMENTARIO };
