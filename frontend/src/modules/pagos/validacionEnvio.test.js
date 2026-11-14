import { DEPARTAMENTOS } from "./departamentos";
import { FORM_INICIAL, validarFormulario, armarPedido } from "./validacionEnvio";

const FORM_DOMICILIO = {
  ...FORM_INICIAL,
  nombre: "Juan Pérez",
  email: "juan@mail.com",
  telefono: "099 123 456",
  departamento: "Montevideo",
  ciudad: "Pocitos",
  direccion: "Av. Brasil 1234 apto 5",
};

const FORM_AGENCIA = {
  ...FORM_DOMICILIO,
  tipoEntrega: "agencia",
  direccion: "",
  agencia: "DAC sucursal Centro",
};

test("hay 19 departamentos distintos", () => {
  expect(DEPARTAMENTOS).toHaveLength(19);
  expect(new Set(DEPARTAMENTOS).size).toBe(19);
});

test("un formulario completo de envío a domicilio no tiene errores", () => {
  expect(validarFormulario(FORM_DOMICILIO)).toEqual({});
});

test("un formulario completo de retiro en agencia no tiene errores y no pide dirección", () => {
  expect(validarFormulario(FORM_AGENCIA)).toEqual({});
});

test("el formulario vacío marca los obligatorios en el orden en que aparecen", () => {
  const errores = validarFormulario(FORM_INICIAL);

  expect(Object.keys(errores)).toEqual(["nombre", "email", "telefono", "departamento", "ciudad", "direccion"]);
});

test("la dirección es obligatoria solo con envío a domicilio y la agencia solo con retiro", () => {
  expect(validarFormulario({ ...FORM_DOMICILIO, direccion: " " })).toHaveProperty("direccion");
  expect(validarFormulario({ ...FORM_DOMICILIO, agencia: "" })).not.toHaveProperty("agencia");

  expect(validarFormulario({ ...FORM_AGENCIA, agencia: " " })).toHaveProperty("agencia");
  expect(validarFormulario({ ...FORM_AGENCIA, direccion: "" })).not.toHaveProperty("direccion");
});

test.each(["1234567", "abc12345678", "099-123-45x6", "1".repeat(16)])("teléfono inválido: %s", (telefono) => {
  expect(validarFormulario({ ...FORM_DOMICILIO, telefono })).toHaveProperty("telefono");
});

test.each(["099123456", "+598 99 123 456", "(02) 901-2345"])("teléfono válido: %s", (telefono) => {
  expect(validarFormulario({ ...FORM_DOMICILIO, telefono })).not.toHaveProperty("telefono");
});

test("la cédula es opcional y, si viene, valida solo el formato (6 a 8 dígitos)", () => {
  expect(validarFormulario({ ...FORM_DOMICILIO, cedula: "" })).not.toHaveProperty("cedula");
  expect(validarFormulario({ ...FORM_DOMICILIO, cedula: "1.234.567-8" })).not.toHaveProperty("cedula");
  expect(validarFormulario({ ...FORM_DOMICILIO, cedula: "12345" })).toHaveProperty("cedula");
  expect(validarFormulario({ ...FORM_DOMICILIO, cedula: "123456789" })).toHaveProperty("cedula");
});

test("el comentario admite hasta 300 caracteres", () => {
  expect(validarFormulario({ ...FORM_DOMICILIO, comentario: "a".repeat(300) })).not.toHaveProperty("comentario");
  expect(validarFormulario({ ...FORM_DOMICILIO, comentario: "a".repeat(301) })).toHaveProperty("comentario");
});

test("email sin formato y departamento fuera de la lista dan error", () => {
  expect(validarFormulario({ ...FORM_DOMICILIO, email: "juan@" })).toHaveProperty("email");
  expect(validarFormulario({ ...FORM_DOMICILIO, departamento: "Buenos Aires" })).toHaveProperty("departamento");
});

describe("armarPedido", () => {
  const items = [{ productoId: 1, cantidad: 2 }];

  test("envío a domicilio: manda la dirección, no la agencia, y solo los datos (sin total)", () => {
    const pedido = armarPedido({ ...FORM_DOMICILIO, nombre: "  Juan Pérez ", agencia: "ignorada" }, items);

    expect(pedido).toEqual({
      nombre: "Juan Pérez",
      email: "juan@mail.com",
      telefono: "099 123 456",
      items,
      envio: {
        tipoEntrega: "domicilio",
        cedula: "",
        departamento: "Montevideo",
        ciudad: "Pocitos",
        direccion: "Av. Brasil 1234 apto 5",
        comentario: "",
      },
    });
    expect(pedido).not.toHaveProperty("total");
  });

  test("retiro en agencia: manda la agencia y no la dirección", () => {
    const pedido = armarPedido({ ...FORM_AGENCIA, direccion: "ignorada" }, items);

    expect(pedido.envio.agencia).toBe("DAC sucursal Centro");
    expect(pedido.envio).not.toHaveProperty("direccion");
    expect(pedido.envio.tipoEntrega).toBe("agencia");
  });
});
