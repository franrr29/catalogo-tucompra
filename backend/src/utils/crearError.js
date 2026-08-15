// crea un error con un status http para que el controller sepa que codigo devolver
function crearError(mensaje, status) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

module.exports = crearError;
