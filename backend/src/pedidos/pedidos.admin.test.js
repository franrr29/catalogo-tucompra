process.env.SECRET_PASSW = "secreto-de-test";
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
const pedidosRoutes = require("./pedidos.routes");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/admin/pedidos", pedidosAdminRoutes);

const cookieAdmin = () => `token=${jwt.sign({ user: "admin" }, "secreto-de-test", { expiresIn: "1h" })}`;

const FILA_LISTADO = {
  id: 12,
  fecha: new Date("2026-11-10T15:30:00Z"),
  nombre: "Juan Perez",
  total: "250.50",
  estado: "pagado",
  tipo_entrega: "domicilio",
  departamento: null,
  ciudad: null,
  estado_envio: null,
  nro_seguimiento: null,
};

const FILA_DETALLE = {
  id: 12,
  fecha: new Date("2026-11-10T15:30:00Z"),
  estado: "pagado",
  total: "250.50",
  mercadopago_id: "1234567890",
  nombre: "Juan Perez",
  email: "juan@mail.com",
  telefono: "099123456",
  tipo_entrega: "domicilio",
  cedula: "12345678",
  departamento: "Montevideo",
  ciudad: "Pocitos",
  direccion: "Calle Falsa 123 apto 4",
  agencia: null,
  comentario: "casa con rejas",
  estado_envio: null,
  nro_seguimiento: null,
  enviado_en: null,
};

const DATOS_SENSIBLES = ["12345678", "Calle Falsa", "casa con rejas", "juan@mail.com", "099123456"];

beforeEach(() => {
  baseDatos.query.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe("permisos: sin cookie de admin no se llega a la base", () => {
  test.each([
    ["listado", "/api/admin/pedidos"],
    ["listado con filtros", "/api/admin/pedidos?estado=pagado&pagina=2"],
    ["detalle", "/api/admin/pedidos/12"],
    ["una ruta cualquiera bajo el router", "/api/admin/pedidos/cualquier/cosa"],
  ])("%s: 401 sin cookie", async (_, ruta) => {
    const respuesta = await request(app).get(ruta);

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.mensaje).toBe("Token requerido para continuar");
    expect(baseDatos.query).not.toHaveBeenCalled();
  });

  test("una cookie invalida tambien da 401", async () => {
    const respuesta = await request(app).get("/api/admin/pedidos").set("Cookie", "token=basura");

    expect(respuesta.status).toBe(401);
    expect(baseDatos.query).not.toHaveBeenCalled();
  });

  test("con la cookie de admin responde y marca la respuesta como no cacheable", async () => {
    baseDatos.query.mockResolvedValueOnce([[{ cantidad: 0 }]]).mockResolvedValueOnce([[]]);

    const respuesta = await request(app).get("/api/admin/pedidos").set("Cookie", cookieAdmin());

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers["cache-control"]).toBe("no-store");
  });
});

describe("listado", () => {
  test("devuelve los datos de la tabla y la paginacion, sin datos sensibles", async () => {
    baseDatos.query.mockResolvedValueOnce([[{ cantidad: 45 }]]).mockResolvedValueOnce([[{
      ...FILA_LISTADO,
      cedula: "12345678",
      direccion: "Calle Falsa 123",
      comentario: "casa con rejas",
      email: "juan@mail.com",
      telefono: "099123456",
    }]]);

    const respuesta = await request(app).get("/api/admin/pedidos?estado=pagado").set("Cookie", cookieAdmin());

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.pedidos).toEqual([
      {
        id: 12,
        fecha: "2026-11-10T15:30:00.000Z",
        nombre: "Juan Perez",
        total: 250.5,
        estado: "pagado",
        tipoEntrega: "domicilio",
        departamento: null,
        ciudad: null,
        estadoEnvio: "por_despachar",
        nroSeguimiento: null,
      },
    ]);
    expect(respuesta.body).toMatchObject({ pagina: 1, limite: 20, total: 45, totalPaginas: 3 });

    const texto = JSON.stringify(respuesta.body);
    DATOS_SENSIBLES.forEach((dato) => expect(texto).not.toContain(dato));
  });

  test("la consulta del listado no pide columnas sensibles", async () => {
    baseDatos.query.mockResolvedValueOnce([[{ cantidad: 0 }]]).mockResolvedValueOnce([[]]);

    await request(app).get("/api/admin/pedidos").set("Cookie", cookieAdmin());

    const sql = baseDatos.query.mock.calls[1][0];
    expect(sql).not.toMatch(/cedula|direccion|comentario|email|telefono|\*/);
  });

  test("filtra por estado con parametros y pagina con LIMIT y OFFSET", async () => {
    baseDatos.query.mockResolvedValueOnce([[{ cantidad: 0 }]]).mockResolvedValueOnce([[]]);

    await request(app).get("/api/admin/pedidos?estado=pendiente&pagina=3&limite=10").set("Cookie", cookieAdmin());

    const [sqlConteo, paramsConteo] = baseDatos.query.mock.calls[0];
    const [sqlListado, paramsListado] = baseDatos.query.mock.calls[1];
    expect(sqlConteo).toMatch(/WHERE estado = \?/);
    expect(paramsConteo).toEqual(["pendiente"]);
    expect(sqlListado).toMatch(/WHERE estado = \?\s+ORDER BY fecha DESC, id DESC\s+LIMIT \? OFFSET \?/);
    expect(paramsListado).toEqual(["pendiente", 10, 20]);
  });

  test.each([[undefined], ["todos"]])("sin filtro de estado (%s) trae todos", async (estado) => {
    baseDatos.query.mockResolvedValueOnce([[{ cantidad: 0 }]]).mockResolvedValueOnce([[]]);

    await request(app)
      .get(estado ? `/api/admin/pedidos?estado=${estado}` : "/api/admin/pedidos")
      .set("Cookie", cookieAdmin());

    expect(baseDatos.query.mock.calls[0][0]).not.toMatch(/WHERE/);
    expect(baseDatos.query.mock.calls[1][1]).toEqual([20, 0]);
  });

  test.each([
    ["estado desconocido", "estado=enviado"],
    ["estado con intento de inyeccion", "estado=pagado'%20OR%20'1'='1"],
    ["estado repetido (arreglo)", "estado=pagado&estado=pendiente"],
    ["pagina cero", "pagina=0"],
    ["pagina negativa", "pagina=-1"],
    ["pagina no numerica", "pagina=abc"],
    ["limite cero", "limite=0"],
    ["limite mayor al maximo", "limite=51"],
    ["limite decimal", "limite=1.5"],
  ])("%s: 400 sin consultar la base", async (_, consulta) => {
    const respuesta = await request(app).get(`/api/admin/pedidos?${consulta}`).set("Cookie", cookieAdmin());

    expect(respuesta.status).toBe(400);
    expect(typeof respuesta.body.mensaje).toBe("string");
    expect(baseDatos.query).not.toHaveBeenCalled();
  });

  test("si la base falla: 500 generico sin detalles internos", async () => {
    baseDatos.query.mockRejectedValueOnce(new Error("Access denied for user 'secreto'@'10.0.0.5'"));

    const respuesta = await request(app).get("/api/admin/pedidos").set("Cookie", cookieAdmin());

    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({ mensaje: "error interno del servidor" });
  });
});

describe("detalle", () => {
  test("devuelve contacto, envio completo, items y el id de mercado pago", async () => {
    baseDatos.query.mockResolvedValueOnce([[FILA_DETALLE]]).mockResolvedValueOnce([[
      { producto_id: 1, nombre: "G-Shock", cantidad: 2, precio_unitario: "100.25" },
      { producto_id: 3, nombre: "Casio", cantidad: 1, precio_unitario: "50.00" },
    ]]);

    const respuesta = await request(app).get("/api/admin/pedidos/12").set("Cookie", cookieAdmin());

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers["cache-control"]).toBe("no-store");
    expect(respuesta.body).toEqual({
      id: 12,
      fecha: "2026-11-10T15:30:00.000Z",
      estado: "pagado",
      total: 250.5,
      mercadopagoId: "1234567890",
      cliente: { nombre: "Juan Perez", email: "juan@mail.com", telefono: "099123456" },
      envio: {
        tipoEntrega: "domicilio",
        cedula: "12345678",
        departamento: "Montevideo",
        ciudad: "Pocitos",
        direccion: "Calle Falsa 123 apto 4",
        agencia: null,
        comentario: "casa con rejas",
        estadoEnvio: "por_despachar",
        nroSeguimiento: null,
        enviadoEn: null,
      },
      items: [
        { productoId: 1, nombre: "G-Shock", cantidad: 2, precioUnitario: 100.25, subtotal: 200.5 },
        { productoId: 3, nombre: "Casio", cantidad: 1, precioUnitario: 50, subtotal: 50 },
      ],
    });
    expect(baseDatos.query.mock.calls[0][1]).toEqual([12]);
  });

  test("un pedido anterior a la funcion de envio devuelve envio: null", async () => {
    baseDatos.query
      .mockResolvedValueOnce([[{ ...FILA_DETALLE, tipo_entrega: null, cedula: null, direccion: null, comentario: null }]])
      .mockResolvedValueOnce([[]]);

    const respuesta = await request(app).get("/api/admin/pedidos/12").set("Cookie", cookieAdmin());

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.envio).toBeNull();
    expect(respuesta.body.items).toEqual([]);
  });

  test("pedido inexistente: 404", async () => {
    baseDatos.query.mockResolvedValueOnce([[]]);

    const respuesta = await request(app).get("/api/admin/pedidos/999").set("Cookie", cookieAdmin());

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toEqual({ mensaje: "pedido no encontrado" });
  });

  test.each(["abc", "0", "-5", "1.5", "12abc", "99999999999999999999"])("id invalido %s: 400", async (id) => {
    const respuesta = await request(app).get(`/api/admin/pedidos/${id}`).set("Cookie", cookieAdmin());

    expect(respuesta.status).toBe(400);
    expect(baseDatos.query).not.toHaveBeenCalled();
  });
});

describe("el endpoint publico no filtra datos personales", () => {
  test("GET /api/pedidos/:id devuelve solo el estado, aunque la base traiga mas columnas", async () => {
    baseDatos.query.mockResolvedValueOnce([[FILA_DETALLE]]);

    const respuesta = await request(app).get("/api/pedidos/12");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ estado: "pagado" });
    const texto = JSON.stringify(respuesta.body);
    DATOS_SENSIBLES.forEach((dato) => expect(texto).not.toContain(dato));
  });

  test("las rutas del admin no estan disponibles sin cookie por el router publico", async () => {
    const respuesta = await request(app).get("/api/pedidos/admin");

    // "admin" no es un id valido para el endpoint publico: 400 y sin tocar la base
    expect(respuesta.status).toBe(400);
    expect(baseDatos.query).not.toHaveBeenCalled();
  });
});
