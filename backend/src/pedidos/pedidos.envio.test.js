process.env.SECRET_PASSW = "secreto-de-test";
// las peticiones que modifican datos exigen el Origin del frontend (proteccion contra CSRF)
process.env.FRONTEND_URL = "https://tienda.ejemplo.test";
const ORIGEN = "https://tienda.ejemplo.test";
process.env.MP_ACCESS_TOKEN = "test-token";

// mockeo la base de datos: ningun test toca la base real
jest.mock("../config/db", () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const baseDatos = require("../config/db");
const pedidosAdminRoutes = require("./pedidos.admin.routes");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/admin/pedidos", pedidosAdminRoutes);

const cookieAdmin = () => `token=${jwt.sign({ user: "admin" }, "secreto-de-test", { expiresIn: "1h" })}`;

const DATOS_SENSIBLES = ["12345678", "Calle Falsa", "casa con rejas", "juan@mail.com", "099123456"];

// fila de la base de un pedido pagado con envio
const fila = (extra = {}) => ({
  id: 12,
  estado: "pagado",
  tipo_entrega: "domicilio",
  estado_envio: null,
  nro_seguimiento: null,
  enviado_en: null,
  ...extra,
});

const sqls = () => baseDatos.query.mock.calls.map(([sql]) => sql);
const llamadaUpdate = () => baseDatos.query.mock.calls.find(([sql]) => /^\s*UPDATE/.test(sql));

// simula: el SELECT del estado actual, el UPDATE y el SELECT posterior
function simularPatch({ antes, despues }) {
  baseDatos.query
    .mockResolvedValueOnce([[antes]])
    .mockResolvedValueOnce([{ affectedRows: 1 }])
    .mockResolvedValueOnce([[despues]]);
}

const patch = (id, body, conCookie = true) => {
  const req = request(app).patch(`/api/admin/pedidos/${id}/envio`);
  if (conCookie) req.set("Cookie", cookieAdmin()).set("Origin", ORIGEN);
  return req.send(body);
};

beforeEach(() => {
  baseDatos.query.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe("permisos", () => {
  test.each([
    ["PATCH del envio", () => request(app).patch("/api/admin/pedidos/12/envio").send({ estadoEnvio: "enviado" })],
    ["GET de nuevos", () => request(app).get("/api/admin/pedidos/nuevos?desde=3")],
    ["listado por estado de envio", () => request(app).get("/api/admin/pedidos?estadoEnvio=enviado")],
  ])("%s: 401 sin cookie y no toca la base", async (_, hacer) => {
    const respuesta = await hacer();

    expect(respuesta.status).toBe(401);
    expect(baseDatos.query).not.toHaveBeenCalled();
  });

  test("una cookie invalida tambien da 401 en el PATCH", async () => {
    const respuesta = await request(app)
      .patch("/api/admin/pedidos/12/envio")
      .set("Cookie", "token=basura")
      .send({ estadoEnvio: "enviado" });

    expect(respuesta.status).toBe(401);
    expect(baseDatos.query).not.toHaveBeenCalled();
  });

  test("las respuestas no son cacheables", async () => {
    baseDatos.query.mockResolvedValueOnce([[{ ultimo_id: 5, por_despachar: 1, cantidad: 0 }]]);

    const respuesta = await request(app).get("/api/admin/pedidos/nuevos?desde=5").set("Cookie", cookieAdmin());

    expect(respuesta.headers["cache-control"]).toBe("no-store");
  });
});

describe("PATCH /:id/envio: transiciones", () => {
  test("por despachar (null) a enviado: completa enviado_en y guarda el seguimiento recortado", async () => {
    simularPatch({
      antes: fila(),
      despues: fila({ estado_envio: "enviado", nro_seguimiento: "UY123", enviado_en: new Date("2026-11-12T10:00:00Z") }),
    });

    const respuesta = await patch(12, { estadoEnvio: "enviado", nroSeguimiento: "  UY123  " });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      id: 12,
      estadoEnvio: "enviado",
      nroSeguimiento: "UY123",
      enviadoEn: "2026-11-12T10:00:00.000Z",
    });
    const [sql, parametros] = llamadaUpdate();
    expect(sql).toMatch(/estado_envio = \?/);
    expect(sql).toMatch(/enviado_en = NOW\(\)/);
    expect(sql).toMatch(/nro_seguimiento = \?/);
    expect(parametros).toEqual(["enviado", "UY123", 12, "por_despachar"]);
  });

  test("enviado a entregado: conserva enviado_en", async () => {
    simularPatch({
      antes: fila({ estado_envio: "enviado", enviado_en: new Date() }),
      despues: fila({ estado_envio: "entregado" }),
    });

    const respuesta = await patch(12, { estadoEnvio: "entregado" });

    expect(respuesta.status).toBe(200);
    const [sql, parametros] = llamadaUpdate();
    expect(sql).not.toMatch(/enviado_en/);
    expect(sql).not.toMatch(/nro_seguimiento/);
    expect(parametros).toEqual(["entregado", 12, "enviado"]);
  });

  test("retroceder de enviado a por despachar limpia enviado_en", async () => {
    simularPatch({
      antes: fila({ estado_envio: "enviado", enviado_en: new Date() }),
      despues: fila({ estado_envio: "por_despachar" }),
    });

    const respuesta = await patch(12, { estadoEnvio: "por_despachar" });

    expect(respuesta.status).toBe(200);
    expect(llamadaUpdate()[0]).toMatch(/enviado_en = NULL/);
  });

  test("retroceder de entregado a enviado es un paso valido y no toca enviado_en", async () => {
    simularPatch({
      antes: fila({ estado_envio: "entregado", enviado_en: new Date() }),
      despues: fila({ estado_envio: "enviado" }),
    });

    const respuesta = await patch(12, { estadoEnvio: "enviado" });

    expect(respuesta.status).toBe(200);
    expect(llamadaUpdate()[0]).not.toMatch(/enviado_en/);
  });

  test("dejar el mismo estado permite corregir el seguimiento", async () => {
    simularPatch({
      antes: fila({ estado_envio: "enviado", nro_seguimiento: "MAL" }),
      despues: fila({ estado_envio: "enviado", nro_seguimiento: "BIEN" }),
    });

    const respuesta = await patch(12, { estadoEnvio: "enviado", nroSeguimiento: "BIEN" });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.nroSeguimiento).toBe("BIEN");
    expect(llamadaUpdate()[0]).not.toMatch(/enviado_en/);
  });

  test("un seguimiento vacio o null lo borra", async () => {
    simularPatch({
      antes: fila({ estado_envio: "enviado", nro_seguimiento: "UY1" }),
      despues: fila({ estado_envio: "enviado", nro_seguimiento: null }),
    });

    await patch(12, { estadoEnvio: "enviado", nroSeguimiento: "   " });

    expect(llamadaUpdate()[1]).toEqual(["enviado", null, 12, "enviado"]);
  });

  test.each([
    ["de por despachar a entregado", fila(), "entregado"],
    ["de entregado a por despachar", fila({ estado_envio: "entregado" }), "por_despachar"],
  ])("no se permite saltar: %s da 409 y no escribe", async (_, antes, destino) => {
    baseDatos.query.mockResolvedValueOnce([[antes]]);

    const respuesta = await patch(12, { estadoEnvio: destino });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.mensaje).toMatch(/un paso a la vez/);
    expect(llamadaUpdate()).toBeUndefined();
  });

  test("si otro cambio se adelanto (el estado final no es el pedido) da 409", async () => {
    baseDatos.query
      .mockResolvedValueOnce([[fila()]])
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      .mockResolvedValueOnce([[fila({ estado_envio: "enviado" })]]);

    const respuesta = await patch(12, { estadoEnvio: "enviado" });

    // alguien ya lo habia pasado a enviado: el resultado coincide con lo pedido, no es un error
    expect(respuesta.status).toBe(200);

    baseDatos.query.mockReset();
    baseDatos.query
      .mockResolvedValueOnce([[fila()]])
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      .mockResolvedValueOnce([[fila({ estado_envio: "entregado" })]]);

    const conflicto = await patch(12, { estadoEnvio: "enviado" });

    expect(conflicto.status).toBe(409);
    expect(conflicto.body.mensaje).toMatch(/cambio mientras/);
  });
});

describe("PATCH /:id/envio: pedidos que no corresponden", () => {
  test.each([
    ["pendiente", fila({ estado: "pendiente" })],
    ["cancelado", fila({ estado: "cancelado" })],
    ["pagado sin datos de envio (pedido viejo)", fila({ tipo_entrega: null })],
  ])("pedido %s: 409 y no escribe", async (_, pedido) => {
    baseDatos.query.mockResolvedValueOnce([[pedido]]);

    const respuesta = await patch(12, { estadoEnvio: "enviado" });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.mensaje).toMatch(/pagados con datos de envio/);
    expect(llamadaUpdate()).toBeUndefined();
  });

  test("pedido inexistente: 404", async () => {
    baseDatos.query.mockResolvedValueOnce([[]]);

    const respuesta = await patch(999, { estadoEnvio: "enviado" });

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.mensaje).toBe("pedido no encontrado");
  });
});

describe("PATCH /:id/envio: validacion", () => {
  test.each([
    ["estado desconocido", "12", { estadoEnvio: "perdido" }],
    ["sin estado", "12", {}],
    ["estado que no es texto", "12", { estadoEnvio: ["enviado"] }],
    ["seguimiento que no es texto", "12", { estadoEnvio: "enviado", nroSeguimiento: 123 }],
    ["seguimiento de mas de 60 caracteres", "12", { estadoEnvio: "enviado", nroSeguimiento: "A".repeat(61) }],
    ["id no numerico", "abc", { estadoEnvio: "enviado" }],
    ["id con sql", "1;DROP", { estadoEnvio: "enviado" }],
    ["id cero", "0", { estadoEnvio: "enviado" }],
  ])("%s: 400 y no toca la base", async (_, id, body) => {
    const respuesta = await patch(id, body);

    expect(respuesta.status).toBe(400);
    expect(baseDatos.query).not.toHaveBeenCalled();
  });

  test("sin body tambien responde 400 y no revienta", async () => {
    const respuesta = await request(app).patch("/api/admin/pedidos/12/envio").set("Cookie", cookieAdmin()).set("Origin", ORIGEN);

    expect(respuesta.status).toBe(400);
  });

  test("un seguimiento de exactamente 60 caracteres es valido y se le quitan los caracteres de control", async () => {
    simularPatch({ antes: fila(), despues: fila({ estado_envio: "enviado" }) });

    const respuesta = await patch(12, { estadoEnvio: "enviado", nroSeguimiento: `A\u0000B${"C".repeat(58)}\n` });

    expect(respuesta.status).toBe(200);
    expect(llamadaUpdate()[1][1]).toBe(`AB${"C".repeat(58)}`);
  });

  test("el seguimiento viaja como parametro, nunca dentro del sql", async () => {
    simularPatch({ antes: fila(), despues: fila({ estado_envio: "enviado" }) });

    await patch(12, { estadoEnvio: "enviado", nroSeguimiento: "x'; DROP TABLE pedidos;--" });

    expect(llamadaUpdate()[0]).not.toMatch(/DROP/);
  });

  test("si la base falla: 500 generico sin datos internos", async () => {
    baseDatos.query.mockRejectedValueOnce(Object.assign(new Error("secreto interno 12345678"), { code: "ER_X" }));

    const respuesta = await patch(12, { estadoEnvio: "enviado" });

    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({ mensaje: "error interno del servidor" });
    expect(JSON.stringify(respuesta.body)).not.toMatch(/secreto|12345678/);
  });
});

describe("listado con filtro por estado de envio", () => {
  const FILA_ENVIO = {
    id: 12,
    fecha: new Date("2026-11-10T15:30:00Z"),
    nombre: "Juan Perez",
    total: "250.50",
    estado: "pagado",
    tipo_entrega: "domicilio",
    departamento: "Montevideo",
    ciudad: "Pocitos",
    estado_envio: null,
    nro_seguimiento: null,
    // columnas que la consulta no deberia pedir, pero si la base las trajera no deben salir
    cedula: "12345678",
    direccion: "Calle Falsa 123",
    comentario: "casa con rejas",
    email: "juan@mail.com",
    telefono: "099123456",
  };

  const listar = (query) => request(app).get(`/api/admin/pedidos${query}`).set("Cookie", cookieAdmin());

  test("por_despachar incluye los null y exige pagado con envio, sin parametro de estado", async () => {
    baseDatos.query.mockResolvedValueOnce([[{ cantidad: 1 }]]).mockResolvedValueOnce([[FILA_ENVIO]]);

    const respuesta = await listar("?estadoEnvio=por_despachar");

    expect(respuesta.status).toBe(200);
    const [sqlConteo, paramsConteo] = baseDatos.query.mock.calls[0];
    expect(sqlConteo).toMatch(/estado = 'pagado' AND tipo_entrega IS NOT NULL/);
    expect(sqlConteo).toMatch(/estado_envio IS NULL OR estado_envio = 'por_despachar'/);
    expect(paramsConteo).toEqual([]);
    expect(respuesta.body.pedidos[0]).toEqual({
      id: 12,
      fecha: "2026-11-10T15:30:00.000Z",
      nombre: "Juan Perez",
      total: 250.5,
      estado: "pagado",
      tipoEntrega: "domicilio",
      departamento: "Montevideo",
      ciudad: "Pocitos",
      estadoEnvio: "por_despachar",
      nroSeguimiento: null,
    });
  });

  test("enviado filtra con parametro", async () => {
    baseDatos.query.mockResolvedValueOnce([[{ cantidad: 0 }]]).mockResolvedValueOnce([[]]);

    const respuesta = await listar("?estadoEnvio=enviado&pagina=2&limite=5");

    expect(respuesta.status).toBe(200);
    expect(baseDatos.query.mock.calls[0][1]).toEqual(["enviado"]);
    expect(baseDatos.query.mock.calls[1][1]).toEqual(["enviado", 5, 5]);
  });

  test("no se filtran la cedula, la direccion, el comentario, el email ni el telefono", async () => {
    baseDatos.query.mockResolvedValueOnce([[{ cantidad: 1 }]]).mockResolvedValueOnce([[FILA_ENVIO]]);

    const respuesta = await listar("?estadoEnvio=por_despachar");

    const texto = JSON.stringify(respuesta.body);
    DATOS_SENSIBLES.forEach((dato) => expect(texto).not.toContain(dato));
    const consulta = baseDatos.query.mock.calls[1][0];
    ["cedula", "direccion", "comentario", "email", "telefono"].forEach((columna) =>
      expect(consulta).not.toMatch(new RegExp(`\\b${columna}\\b`))
    );
  });

  test("un pedido pagado sin envio (viejo) sale con estadoEnvio null", async () => {
    baseDatos.query
      .mockResolvedValueOnce([[{ cantidad: 1 }]])
      .mockResolvedValueOnce([[{ ...FILA_ENVIO, tipo_entrega: null, departamento: null, ciudad: null }]]);

    const respuesta = await listar("?estado=pagado");

    expect(respuesta.body.pedidos[0].estadoEnvio).toBeNull();
  });

  test.each([
    ["estadoEnvio desconocido", "?estadoEnvio=perdido"],
    ["estado y estadoEnvio juntos", "?estado=pagado&estadoEnvio=enviado"],
  ])("%s: 400", async (_, query) => {
    const respuesta = await listar(query);

    expect(respuesta.status).toBe(400);
    expect(baseDatos.query).not.toHaveBeenCalled();
  });
});

describe("detalle con seguimiento", () => {
  test("devuelve estadoEnvio, nroSeguimiento y enviadoEn dentro de envio", async () => {
    baseDatos.query
      .mockResolvedValueOnce([[{
        id: 12,
        fecha: new Date("2026-11-10T15:30:00Z"),
        estado: "pagado",
        total: "100",
        mercadopago_id: "9",
        nombre: "Juan",
        email: "juan@mail.com",
        telefono: "099123456",
        tipo_entrega: "agencia",
        cedula: null,
        departamento: "Salto",
        ciudad: "Salto",
        direccion: null,
        agencia: "DAC",
        comentario: null,
        estado_envio: "enviado",
        nro_seguimiento: "UY123",
        enviado_en: new Date("2026-11-12T10:00:00Z"),
      }]])
      .mockResolvedValueOnce([[]]);

    const respuesta = await request(app).get("/api/admin/pedidos/12").set("Cookie", cookieAdmin());

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.envio).toMatchObject({
      estadoEnvio: "enviado",
      nroSeguimiento: "UY123",
      enviadoEn: "2026-11-12T10:00:00.000Z",
    });
  });
});

describe("GET /nuevos", () => {
  const nuevos = (query = "") => request(app).get(`/api/admin/pedidos/nuevos${query}`).set("Cookie", cookieAdmin());

  test("con desde devuelve cantidad, los ultimos, ultimoId y porDespachar", async () => {
    baseDatos.query
      .mockResolvedValueOnce([[{ ultimo_id: 15, por_despachar: "4", cantidad: "2" }]])
      .mockResolvedValueOnce([[
        { id: 15, fecha: new Date("2026-11-13T09:00:00Z"), nombre: "Ana", total: "300.00", ciudad: "Salto", cedula: "1", direccion: "x" },
        { id: 14, fecha: new Date("2026-11-13T08:00:00Z"), nombre: "Beto", total: "80", ciudad: "Rivera" },
      ]]);

    const respuesta = await nuevos("?desde=13");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      cantidad: 2,
      ultimoId: 15,
      porDespachar: 4,
      ultimos: [
        { id: 15, fecha: "2026-11-13T09:00:00.000Z", nombre: "Ana", total: 300, ciudad: "Salto" },
        { id: 14, fecha: "2026-11-13T08:00:00.000Z", nombre: "Beto", total: 80, ciudad: "Rivera" },
      ],
    });
    expect(baseDatos.query.mock.calls[0][1]).toEqual([13]);
    expect(baseDatos.query.mock.calls[1][1]).toEqual([13, 10]);
  });

  test("las consultas solo miran pagados con envio y limitan los ultimos a 10", async () => {
    baseDatos.query
      .mockResolvedValueOnce([[{ ultimo_id: 30, por_despachar: 25, cantidad: 25 }]])
      .mockResolvedValueOnce([[]]);

    const respuesta = await nuevos("?desde=5");

    expect(respuesta.body.cantidad).toBe(25);
    baseDatos.query.mock.calls.forEach(([sql]) =>
      expect(sql).toMatch(/estado = 'pagado' AND tipo_entrega IS NOT NULL/)
    );
    expect(baseDatos.query.mock.calls[1][0]).toMatch(/LIMIT \?/);
  });

  test("no devuelve cedula, direccion, comentario, email ni telefono", async () => {
    baseDatos.query
      .mockResolvedValueOnce([[{ ultimo_id: 15, por_despachar: 1, cantidad: 1 }]])
      .mockResolvedValueOnce([[{
        id: 15, fecha: new Date(), nombre: "Ana", total: "1", ciudad: "Salto",
        cedula: "12345678", direccion: "Calle Falsa", comentario: "casa con rejas", email: "juan@mail.com", telefono: "099123456",
      }]]);

    const respuesta = await nuevos("?desde=1");

    DATOS_SENSIBLES.forEach((dato) => expect(JSON.stringify(respuesta.body)).not.toContain(dato));
    const consulta = baseDatos.query.mock.calls[1][0];
    ["cedula", "direccion", "comentario", "email", "telefono"].forEach((columna) =>
      expect(consulta).not.toMatch(new RegExp(`\\b${columna}\\b`))
    );
  });

  test("sin desde: cantidad 0, sin segunda consulta, y ultimoId para fijar el punto de partida", async () => {
    baseDatos.query.mockResolvedValueOnce([[{ ultimo_id: 15, por_despachar: 3, cantidad: 0 }]]);

    const respuesta = await nuevos();

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ cantidad: 0, ultimos: [], ultimoId: 15, porDespachar: 3 });
    expect(baseDatos.query).toHaveBeenCalledTimes(1);
    expect(baseDatos.query.mock.calls[0][1]).toEqual([null]);
  });

  test("sin ventas todavia: ultimoId 0", async () => {
    baseDatos.query.mockResolvedValueOnce([[{ ultimo_id: null, por_despachar: 0, cantidad: 0 }]]);

    const respuesta = await nuevos("?desde=0");

    expect(respuesta.body).toEqual({ cantidad: 0, ultimos: [], ultimoId: 0, porDespachar: 0 });
  });

  test("la ruta no se confunde con /:id", async () => {
    baseDatos.query.mockResolvedValueOnce([[{ ultimo_id: 1, por_despachar: 0, cantidad: 0 }]]);

    const respuesta = await nuevos("?desde=1");

    expect(respuesta.status).toBe(200);
    expect(sqls()[0]).toMatch(/MAX\(id\)/);
  });

  test.each(["abc", "-1", "1.5", "1;DROP"])("desde invalido (%s): 400 y no toca la base", async (desde) => {
    const respuesta = await nuevos(`?desde=${encodeURIComponent(desde)}`);

    expect(respuesta.status).toBe(400);
    expect(baseDatos.query).not.toHaveBeenCalled();
  });

  test("si la base falla: 500 generico", async () => {
    baseDatos.query.mockRejectedValueOnce(Object.assign(new Error("boom"), { code: "ER_X" }));

    const respuesta = await nuevos("?desde=1");

    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({ mensaje: "error interno del servidor" });
  });
});
