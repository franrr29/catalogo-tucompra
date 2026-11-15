// opciones de tls de la conexion a la base segun el host:
//  - host local (desarrollo): sin tls
//  - host remoto con DB_SSL_CA (contenido PEM de la CA del proveedor, por ejemplo la de Aiven): tls verificado
//    (certificado y nombre del host). es lo correcto en produccion
//  - host remoto sin DB_SSL_CA: tls SIN verificar el certificado, como funcionaba hasta ahora, con un aviso en el log.
//    asi el despliegue del codigo no rompe nada; la verificacion se activa cargando DB_SSL_CA.
//    para volver atras si la conexion falla, basta quitar DB_SSL_CA y redesplegar
const { hostDeUrl, esHostLocal } = require("./proteccionBase");

// los paneles de variables de entorno a veces guardan el PEM en una sola linea con "\n" escrito literal
function normalizarCa(valor) {
  const pem = String(valor).replace(/\\n/g, "\n").trim();
  if (!pem.includes("-----BEGIN CERTIFICATE-----") || !pem.includes("-----END CERTIFICATE-----")) {
    throw new Error(
      "DB_SSL_CA no parece un certificado PEM (falta -----BEGIN CERTIFICATE-----). " +
        "Pega el contenido completo de la CA que se descarga de la consola del proveedor, o quita la variable para volver al comportamiento anterior."
    );
  }
  return pem;
}

let avisoMostrado = false;

function crearOpcionesSsl(url, entorno = process.env) {
  if (esHostLocal(hostDeUrl(url))) return {};

  const ca = entorno.DB_SSL_CA;
  if (ca && String(ca).trim()) {
    return { ssl: { ca: normalizarCa(ca), rejectUnauthorized: true } };
  }

  if (!avisoMostrado) {
    avisoMostrado = true;
    console.warn(
      "DB_SSL_CA no esta definida: la conexion a la base usa tls SIN verificar el certificado. " +
        "Carga la CA del proveedor en DB_SSL_CA para verificarlo."
    );
  }
  return { ssl: { rejectUnauthorized: false } };
}

module.exports = { crearOpcionesSsl, normalizarCa };
