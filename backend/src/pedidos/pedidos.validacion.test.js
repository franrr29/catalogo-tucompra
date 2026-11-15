const { validarDatosPedido, validarItems, DEPARTAMENTOS } = require("./pedidos.validacion");

const BASE_DOMICILIO = {
  nombre: "  Juan   Perez ",
  email: "juan@mail.com",
  telefono: "099 123 456",
  envio: {
    tipoEntrega: "domicilio",
    cedula: "1.234.567-8",
    departamento: "Montevideo",
    ciudad: "Pocitos",
    direccion: "Av. Brasil 1234 apto 5",
    comentario: "casa con rejas",
  },
};

const BASE_AGENCIA = {
  ...BASE_DOMICILIO,
  envio: {
    tipoEntrega: "agencia",
    departamento: "Salto",
    ciudad: "Salto",
    agencia: "DAC sucursal centro",
  },
};

// copia del pedido base con cambios en el envio
const conEnvio = (base, cambios) => ({ ...base, envio: { ...base.envio, ...cambios } });

// verifica que la validacion falle con un 400 sobre ese campo
function esperarError(datos, campo, fragmentoMensaje) {
  let error;
  try {
    validarDatosPedido(datos);
  } catch (e) {
    error = e;
  }
  expect(error).toBeDefined();
  expect(error.status).toBe(400);
  expect(error.campo).toBe(campo);
  if (fragmentoMensaje) expect(error.message).toMatch(fragmentoMensaje);
}

test("la lista tiene los 19 departamentos", () => {
  expect(DEPARTAMENTOS).toHaveLength(19);
  expect(new Set(DEPARTAMENTOS).size).toBe(19);
});

test("envio a domicilio valido: normaliza los datos y descarta la agencia", () => {
  const datos = validarDatosPedido(BASE_DOMICILIO);

  expect(datos).toEqual({
    nombre: "Juan Perez",
    email: "juan@mail.com",
    telefono: "099123456",
    envio: {
      tipoEntrega: "domicilio",
      cedula: "12345678",
      departamento: "Montevideo",
      ciudad: "Pocitos",
      direccion: "Av. Brasil 1234 apto 5",
      agencia: null,
      comentario: "casa con rejas",
    },
  });
});

test("retiro en agencia valido: no pide direccion y la descarta aunque venga", () => {
  const datos = validarDatosPedido(conEnvio(BASE_AGENCIA, { direccion: "Calle que no corresponde 123" }));

  expect(datos.envio.tipoEntrega).toBe("agencia");
  expect(datos.envio.agencia).toBe("DAC sucursal centro");
  expect(datos.envio.direccion).toBeNull();
  expect(datos.envio.cedula).toBeNull();
  expect(datos.envio.comentario).toBeNull();
});

test("con envio a domicilio, la agencia que venga se descarta", () => {
  const datos = validarDatosPedido(conEnvio(BASE_DOMICILIO, { agencia: "DAC" }));
  expect(datos.envio.agencia).toBeNull();
});

describe("campos obligatorios", () => {
  test("nombre vacio", () => esperarError({ ...BASE_DOMICILIO, nombre: "   " }, "nombre", /obligatorio/));
  test("nombre demasiado largo", () => esperarError({ ...BASE_DOMICILIO, nombre: "a".repeat(101) }, "nombre", /entre 2 y 100/));
  test("email faltante", () => esperarError({ ...BASE_DOMICILIO, email: undefined }, "email", /obligatorio/));
  test("email sin formato", () => esperarError({ ...BASE_DOMICILIO, email: "juan@" }, "email", /no es valido/));
  test("telefono faltante", () => esperarError({ ...BASE_DOMICILIO, telefono: "" }, "telefono", /obligatorio/));
  test("sin objeto de envio", () => esperarError({ ...BASE_DOMICILIO, envio: undefined }, "envio", /faltan los datos de envio/));
  test("envio que no es un objeto", () => esperarError({ ...BASE_DOMICILIO, envio: "domicilio" }, "envio"));
  test("ciudad vacia", () => esperarError(conEnvio(BASE_DOMICILIO, { ciudad: " " }), "ciudad", /obligatorio/));
  test("departamento vacio", () => esperarError(conEnvio(BASE_DOMICILIO, { departamento: "" }), "departamento"));
});

describe("campos condicionales", () => {
  test("domicilio sin direccion", () => esperarError(conEnvio(BASE_DOMICILIO, { direccion: "" }), "direccion", /obligatorio/));
  test("domicilio con direccion demasiado corta", () => esperarError(conEnvio(BASE_DOMICILIO, { direccion: "abc" }), "direccion", /entre 5 y 200/));
  test("domicilio con direccion demasiado larga", () => esperarError(conEnvio(BASE_DOMICILIO, { direccion: "a".repeat(201) }), "direccion"));
  test("agencia sin agencia de retiro", () => esperarError(conEnvio(BASE_AGENCIA, { agencia: " " }), "agencia", /obligatorio/));
  test("agencia demasiado larga", () => esperarError(conEnvio(BASE_AGENCIA, { agencia: "a".repeat(151) }), "agencia"));
});

describe("tipo de entrega y departamento", () => {
  test("tipo de entrega invalido", () => esperarError(conEnvio(BASE_DOMICILIO, { tipoEntrega: "drone" }), "tipoEntrega"));
  test("tipo de entrega faltante", () => esperarError(conEnvio(BASE_DOMICILIO, { tipoEntrega: undefined }), "tipoEntrega"));
  test("departamento fuera de la lista", () => esperarError(conEnvio(BASE_DOMICILIO, { departamento: "Buenos Aires" }), "departamento", /no es valido/));
  test("departamento con otra grafia no se acepta", () => esperarError(conEnvio(BASE_DOMICILIO, { departamento: "montevideo" }), "departamento"));
  test.each(DEPARTAMENTOS)("departamento valido: %s", (departamento) => {
    expect(validarDatosPedido(conEnvio(BASE_DOMICILIO, { departamento })).envio.departamento).toBe(departamento);
  });
});

describe("telefono", () => {
  test.each([
    ["099123456", "099123456"],
    ["099 123 456", "099123456"],
    ["+598 99 123 456", "+59899123456"],
    ["(02) 901-2345", "029012345"],
  ])("formato valido %s", (entrada, esperado) => {
    expect(validarDatosPedido({ ...BASE_DOMICILIO, telefono: entrada }).telefono).toBe(esperado);
  });

  test.each(["1234567", "1".repeat(16), "abc12345678", "099-123-45x6", "++59899123456"])(
    "formato invalido %s",
    (entrada) => esperarError({ ...BASE_DOMICILIO, telefono: entrada }, "telefono", /no es valido/)
  );
});

describe("cedula (opcional, solo formato)", () => {
  test("se puede omitir", () => {
    expect(validarDatosPedido(conEnvio(BASE_DOMICILIO, { cedula: undefined })).envio.cedula).toBeNull();
    expect(validarDatosPedido(conEnvio(BASE_DOMICILIO, { cedula: "" })).envio.cedula).toBeNull();
  });

  test.each([
    ["1.234.567-8", "12345678"],
    ["12345678", "12345678"],
    ["123456-7", "1234567"],
    ["123456", "123456"],
  ])("formato valido %s", (entrada, esperado) => {
    expect(validarDatosPedido(conEnvio(BASE_DOMICILIO, { cedula: entrada })).envio.cedula).toBe(esperado);
  });

  test.each(["12345", "123456789", "abcdefgh", "1234 56a8"])("formato invalido %s", (entrada) =>
    esperarError(conEnvio(BASE_DOMICILIO, { cedula: entrada }), "cedula", /entre 6 y 8 digitos/)
  );
});

describe("comentario", () => {
  test("300 caracteres exactos se aceptan", () => {
    const comentario = "a".repeat(300);
    expect(validarDatosPedido(conEnvio(BASE_DOMICILIO, { comentario })).envio.comentario).toBe(comentario);
  });

  test("301 caracteres se rechazan", () =>
    esperarError(conEnvio(BASE_DOMICILIO, { comentario: "a".repeat(301) }), "comentario", /300 caracteres/));

  test("vacio queda en null", () => {
    expect(validarDatosPedido(conEnvio(BASE_DOMICILIO, { comentario: "   " })).envio.comentario).toBeNull();
  });

  test("conserva saltos de linea y quita caracteres de control", () => {
    const comentario = "timbre roto\r\nllamar\u0000 al celular";
    expect(validarDatosPedido(conEnvio(BASE_DOMICILIO, { comentario })).envio.comentario).toBe("timbre roto\nllamar al celular");
  });

  test("un valor que no es texto se rechaza", () =>
    esperarError(conEnvio(BASE_DOMICILIO, { comentario: { x: 1 } }), "comentario"));
});

test("los campos de una sola linea no aceptan saltos de linea ni caracteres de control", () => {
  const datos = validarDatosPedido(conEnvio(BASE_DOMICILIO, { direccion: "Av. Brasil\n1234\t apto 5" }));
  expect(datos.envio.direccion).toBe("Av. Brasil 1234 apto 5");
});

describe("validarItems", () => {
  test("acepta items validos con productos distintos", () => {
    expect(() => validarItems([{ productoId: 1, cantidad: 2 }, { productoId: 7, cantidad: 1 }])).not.toThrow();
  });

  test.each([
    ["no es un array", undefined],
    ["array vacio", []],
    ["item null", [null]],
    ["productoId como texto", [{ productoId: "1", cantidad: 1 }]],
    ["cantidad cero", [{ productoId: 1, cantidad: 0 }]],
    ["productos repetidos", [{ productoId: 2, cantidad: 1 }, { productoId: 2, cantidad: 1 }]],
  ])("rechaza con 400 y campo items: %s", (_, items) => {
    expect.assertions(2);
    try {
      validarItems(items);
    } catch (error) {
      expect(error.status).toBe(400);
      expect(error.campo).toBe("items");
    }
  });
});
