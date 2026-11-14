import { DEPARTAMENTOS } from "./departamentos";

export const MAX_COMENTARIO = 300;

export const FORM_INICIAL = {
  nombre: "",
  email: "",
  telefono: "",
  cedula: "",
  tipoEntrega: "domicilio",
  departamento: "",
  ciudad: "",
  direccion: "",
  agencia: "",
  comentario: "",
};

// id del input de cada campo, para enfocar el primero con error
export const idCampo = (campo) => `envio-${campo}`;

// validacion para dar feedback rapido en pantalla; las mismas reglas las valida el backend, que es quien decide
// devuelve { campo: mensaje } solo con los campos con error, en el mismo orden en que aparecen en el formulario
export function validarFormulario(form) {
  const errores = {};
  const esDomicilio = form.tipoEntrega === "domicilio";

  const nombre = form.nombre.trim();
  if (!nombre) errores.nombre = "Ingresá el nombre de quien recibe.";
  else if (nombre.length < 2 || nombre.length > 100) errores.nombre = "El nombre debe tener entre 2 y 100 caracteres.";

  const email = form.email.trim();
  if (!email) errores.email = "Ingresá tu email.";
  else if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.email = "Ingresá un email válido.";

  const telefono = form.telefono.trim();
  const digitosTelefono = telefono.replace(/\D/g, "");
  if (!telefono) errores.telefono = "Ingresá un teléfono de contacto.";
  else if (!/^\+?[\d\s\-().]+$/.test(telefono) || digitosTelefono.length < 8 || digitosTelefono.length > 15) {
    errores.telefono = "Ingresá un teléfono válido, solo números (entre 8 y 15 dígitos).";
  }

  const cedula = form.cedula.replace(/[.\-\s]/g, "");
  if (cedula && !/^\d{6,8}$/.test(cedula)) errores.cedula = "La cédula debe tener entre 6 y 8 dígitos.";

  if (!DEPARTAMENTOS.includes(form.departamento)) errores.departamento = "Elegí un departamento.";

  const ciudad = form.ciudad.trim();
  if (!ciudad) errores.ciudad = "Ingresá la ciudad o localidad.";
  else if (ciudad.length < 2 || ciudad.length > 100) errores.ciudad = "La ciudad debe tener entre 2 y 100 caracteres.";

  if (esDomicilio) {
    const direccion = form.direccion.trim();
    if (!direccion) errores.direccion = "Ingresá la dirección de entrega.";
    else if (direccion.length < 5 || direccion.length > 200) errores.direccion = "La dirección debe tener entre 5 y 200 caracteres.";
  } else {
    const agencia = form.agencia.trim();
    if (!agencia) errores.agencia = "Ingresá la agencia o sucursal donde retirás.";
    else if (agencia.length < 2 || agencia.length > 150) errores.agencia = "La agencia debe tener entre 2 y 150 caracteres.";
  }

  if (form.comentario.length > MAX_COMENTARIO) errores.comentario = `El comentario no puede superar los ${MAX_COMENTARIO} caracteres.`;

  return errores;
}

// arma el cuerpo del POST /api/pedidos; solo se mandan los datos, el total lo calcula el backend
export function armarPedido(form, items) {
  const esDomicilio = form.tipoEntrega === "domicilio";

  return {
    nombre: form.nombre.trim(),
    email: form.email.trim(),
    telefono: form.telefono.trim(),
    items,
    envio: {
      tipoEntrega: form.tipoEntrega,
      cedula: form.cedula.trim(),
      departamento: form.departamento,
      ciudad: form.ciudad.trim(),
      ...(esDomicilio ? { direccion: form.direccion.trim() } : { agencia: form.agencia.trim() }),
      comentario: form.comentario.trim(),
    },
  };
}
