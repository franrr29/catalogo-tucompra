process.env.SECRET_PASSW = "secreto-de-test";

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
const reportesRoutes = require("./reportes.routes");
const { periodoADesde } = require("./reportes.service");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/admin/reportes", reportesRoutes);

const cookieAdmin = () => `token=${jwt.sign({ user: "admin" }, "secreto-de-test", { expiresIn: "1h" })}`;
const obtener = (ruta) => request(app).get(`/api/admin/reportes${ruta}`).set("Cookie", cookieAdmin());

const FECHA_SQL = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const sqls = () => baseDatos.query.mock.calls.map(([sql]) => sql);

beforeEach(() => {
  baseDatos.query.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
  jest.restoreAllMocks();
});

describe("limites de periodo con desfase fijo -03:00 (la base guarda fecha en UTC)", () => {
  const utc = (...partes) => Date.UTC(...partes);

  test("este mes: empieza el dia 1 a las 00:00 de Uruguay, o sea 03:00 UTC", () => {
    expect(periodoADesde("mes", utc(2026, 10, 14, 23, 27))).toBe("2026-11-01 03:00:00");
  });

  test("justo antes de medianoche del fin de mes en Uruguay todavia es el mes anterior", () => {
    // 2026-12-01 02:59:59 UTC = 2026-11-30 23:59:59 en Uruguay
    expect(periodoADesde("mes", utc(2026, 11, 1, 2, 59, 59))).toBe("2026-11-01 03:00:00");
  });

  test("a medianoche de Uruguay empieza el mes nuevo", () => {
    // 2026-12-01 03:00:00 UTC = 2026-12-01 00:00:00 en Uruguay
    expect(periodoADesde("mes", utc(2026, 11, 1, 3, 0, 0))).toBe("2026-12-01 03:00:00");
  });

  test("cambio de anio: el 1 de enero a las 02:00 UTC todavia es diciembre en Uruguay", () => {
    expect(periodoADesde("mes", utc(2027, 0, 1, 2, 0, 0))).toBe("2026-12-01 03:00:00");
    expect(periodoADesde("mes", utc(2027, 0, 1, 3, 0, 0))).toBe("2027-01-01 03:00:00");
  });

  test("ultimos 30 dias: exactamente 30 dias antes de ahora", () => {
    expect(periodoADesde("30dias", utc(2026, 10, 14, 23, 27, 5))).toBe("2026-10-15 23:27:05");
  });

  test("todo: sin limite inferior", () => {
    expect(periodoADesde("todo", utc(2026, 10, 14))).toBeNull();
  });

  test("devuelve strings, nunca objetos Date", () => {
    for (const periodo of ["mes", "30dias"]) {
      const desde = periodoADesde(periodo, utc(2026, 10, 14, 12));
      expect(typeof desde).toBe("string");
      expect(desde).toMatch(FECHA_SQL);
    }
  });

  test("el resultado no depende de la zona horaria del proceso (PC en Montevideo vs Render en UTC)", () => {
    const zonaOriginal = process.env.TZ;
    const ahora = utc(2026, 11, 1, 2, 30);
    try {
      const resultados = ["UTC", "America/Montevideo", "Asia/Tokyo", "Pacific/Auckland", "America/Los_Angeles"].map(
        (zona) => {
          process.env.TZ = zona;
          return ["mes", "30dias"].map((periodo) => periodoADesde(periodo, ahora));
        }
      );
      resultados.forEach((resultado) => expect(resultado).toEqual(resultados[0]));
      expect(resultados[0]).toEqual(["2026-11-01 03:00:00", "2026-11-01 02:30:00"]);
    } finally {
      if (zonaOriginal === undefined) delete process.env.TZ;
      else process.env.TZ = zonaOriginal;
    }
  });
});

describe("autenticacion y cache", () => {
  test.each(["/mas-vendidos", "/departamentos", "/margen"])("%s sin cookie devuelve 401 y no consulta la base", async (ruta) => {
    const respuesta = await request(app).get(`/api/admin/reportes${ruta}`);

    expect(respuesta.status).toBe(401);
    expect(baseDatos.query).not.toHaveBeenCalled();
  });

  test("con un token invalido tambien devuelve 401", async () => {
    const respuesta = await request(app).get("/api/admin/reportes/margen").set("Cookie", "token=falso");

    expect(respuesta.status).toBe(401);
    expect(baseDatos.query).not.toHaveBeenCalled();
  });

  test.each(["/mas-vendidos", "/departamentos", "/margen"])("%s responde con Cache-Control no-store", async (ruta) => {
    baseDatos.query.mockResolvedValue([[]]);
    baseDatos.query.mockResolvedValueOnce([[{ ingresos_totales: 0, ingresos_con_costo: 0, costo: 0 }]]);

    const respuesta = await obtener(ruta);

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers["cache-control"]).toBe("no-store");
  });
});

describe("parametros de fecha", () => {
  beforeEach(() => {
    baseDatos.query.mockResolvedValue([[]]);
  });

  test("viajan como string 'YYYY-MM-DD HH:MM:SS' ya convertido, parametrizados, nunca como Date", async () => {
    jest.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 10, 14, 23, 27, 0));

    await obtener("/mas-vendidos?periodo=mes");
    await obtener("/departamentos?periodo=30dias");

    const [consultaMasVendidos, consultaDepartamentos] = baseDatos.query.mock.calls;
    expect(consultaMasVendidos[1][0]).toBe("2026-11-01 03:00:00");
    expect(consultaDepartamentos[1][0]).toBe("2026-10-15 23:27:00");
    for (const [sql, parametros] of baseDatos.query.mock.calls) {
      expect(sql).toMatch(/p\.fecha >= \?/);
      expect(sql).not.toMatch(/2026/); // el valor nunca se escribe dentro del SQL
      parametros.forEach((parametro) => expect(parametro instanceof Date).toBe(false));
    }
  });

  test("el periodo 'todo' no agrega condicion de fecha", async () => {
    baseDatos.query.mockResolvedValueOnce([[{ ingresos_totales: 0, ingresos_con_costo: 0, costo: 0 }]]);

    await obtener("/margen?periodo=todo");

    expect(sqls()[0]).not.toMatch(/p\.fecha/);
    expect(baseDatos.query.mock.calls[0][1]).toEqual([]);
  });

  test("sin periodo usa 'este mes'", async () => {
    const respuesta = await obtener("/departamentos");

    expect(respuesta.body.periodo).toBe("mes");
    expect(baseDatos.query.mock.calls[0][1][0]).toMatch(FECHA_SQL);
  });

  test.each([["semana"], ["MES"], ["mes;DROP TABLE pedidos"], ["1"]])("periodo invalido (%s): 400 y no consulta", async (periodo) => {
    for (const ruta of ["/mas-vendidos", "/departamentos", "/margen"]) {
      const respuesta = await obtener(`${ruta}?periodo=${encodeURIComponent(periodo)}`);
      expect(respuesta.status).toBe(400);
    }
    expect(baseDatos.query).not.toHaveBeenCalled();
  });
});

describe("GET /mas-vendidos", () => {
  test("devuelve unidades e ingresos por producto como numeros, con el activo como booleano", async () => {
    baseDatos.query.mockResolvedValue([
      [
        { producto_id: 3, nombre: "Reloj A", activo: 1, unidades: "12", ingresos: "2400.00" },
        { producto_id: 8, nombre: "Reloj B", activo: 0, unidades: "5", ingresos: "1500.50" },
      ],
    ]);

    const respuesta = await obtener("/mas-vendidos?periodo=todo");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      periodo: "todo",
      orden: "unidades",
      productos: [
        { productoId: 3, nombre: "Reloj A", activo: true, unidades: 12, ingresos: 2400 },
        { productoId: 8, nombre: "Reloj B", activo: false, unidades: 5, ingresos: 1500.5 },
      ],
    });
  });

  test("solo cuenta pedidos pagados y el limite por defecto es 10, parametrizado", async () => {
    baseDatos.query.mockResolvedValue([[]]);

    await obtener("/mas-vendidos?periodo=todo");

    const [sql, parametros] = baseDatos.query.mock.calls[0];
    expect(sql).toMatch(/p\.estado = 'pagado'/);
    expect(sql).toMatch(/ORDER BY unidades DESC, ingresos DESC/);
    expect(parametros).toEqual([10]);
  });

  test("ordenar por ingresos y limite propio", async () => {
    baseDatos.query.mockResolvedValue([[]]);

    await obtener("/mas-vendidos?periodo=todo&orden=ingresos&limite=50");

    const [sql, parametros] = baseDatos.query.mock.calls[0];
    expect(sql).toMatch(/ORDER BY ingresos DESC, unidades DESC/);
    expect(parametros).toEqual([50]);
  });

  test.each([["orden=nombre"], ["orden=unidades;DROP TABLE x"], ["limite=0"], ["limite=51"], ["limite=-1"], ["limite=5abc"], ["limite=1.5"]])(
    "parametro invalido (%s): 400 y no consulta",
    async (consulta) => {
      const respuesta = await obtener(`/mas-vendidos?${consulta}`);

      expect(respuesta.status).toBe(400);
      expect(baseDatos.query).not.toHaveBeenCalled();
    }
  );
});

describe("GET /departamentos", () => {
  test("devuelve cantidad de pedidos e ingresos por departamento", async () => {
    baseDatos.query.mockResolvedValue([
      [
        { departamento: "Montevideo", pedidos: "7", ingresos: "9800.00" },
        { departamento: "Rivera", pedidos: "1", ingresos: "450.25" },
      ],
    ]);

    const respuesta = await obtener("/departamentos?periodo=todo");

    expect(respuesta.body).toEqual({
      periodo: "todo",
      departamentos: [
        { departamento: "Montevideo", pedidos: 7, ingresos: 9800 },
        { departamento: "Rivera", pedidos: 1, ingresos: 450.25 },
      ],
    });
  });

  test("solo pedidos pagados y con datos de envio", async () => {
    baseDatos.query.mockResolvedValue([[]]);

    await obtener("/departamentos?periodo=todo");

    const sql = sqls()[0];
    expect(sql).toMatch(/p\.estado = 'pagado'/);
    expect(sql).toMatch(/p\.tipo_entrega IS NOT NULL/);
    expect(sql).toMatch(/p\.departamento IS NOT NULL/);
    expect(sql).toMatch(/GROUP BY p\.departamento/);
  });

  test("sin ventas devuelve una lista vacia", async () => {
    baseDatos.query.mockResolvedValue([[]]);

    const respuesta = await obtener("/departamentos?periodo=todo");

    expect(respuesta.body.departamentos).toEqual([]);
  });
});

describe("GET /margen", () => {
  const totales = (ingresosTotales, ingresosConCosto, costo) => [
    [{ ingresos_totales: ingresosTotales, ingresos_con_costo: ingresosConCosto, costo }],
  ];

  test("calcula ganancia y margen solo con las lineas que tienen costo, e informa lo que queda sin costo", async () => {
    baseDatos.query
      .mockResolvedValueOnce(totales("1000.00", "800.00", "500.00"))
      .mockResolvedValueOnce([[{ id: 4, nombre: "Reloj sin costo" }]]);

    const respuesta = await obtener("/margen?periodo=todo");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      periodo: "todo",
      ingresosTotales: 1000,
      ingresosConCosto: 800,
      ingresosSinCosto: 200,
      costo: 500,
      ganancia: 300,
      margenPct: 37.5,
      coberturaPct: 80,
      productosSinCosto: [{ id: 4, nombre: "Reloj sin costo" }],
    });
  });

  test("ventas sin ningun costo: el margen es null (sin dato), no 0 ni inventado", async () => {
    baseDatos.query.mockResolvedValueOnce(totales("500.00", "0", "0")).mockResolvedValueOnce([[]]);

    const respuesta = await obtener("/margen?periodo=todo");

    expect(respuesta.body.margenPct).toBeNull();
    expect(respuesta.body.ganancia).toBe(0);
    expect(respuesta.body.ingresosSinCosto).toBe(500);
    expect(respuesta.body.coberturaPct).toBe(0);
  });

  test("periodo sin ventas: margen y cobertura null", async () => {
    baseDatos.query.mockResolvedValueOnce(totales("0", "0", "0")).mockResolvedValueOnce([[]]);

    const respuesta = await obtener("/margen?periodo=mes");

    expect(respuesta.body).toMatchObject({ ingresosTotales: 0, ganancia: 0, margenPct: null, coberturaPct: null });
  });

  test("un costo de 0 cuenta como costo (margen 100%), distinto de un costo desconocido", async () => {
    baseDatos.query.mockResolvedValueOnce(totales("100.00", "100.00", "0.00")).mockResolvedValueOnce([[]]);

    const respuesta = await obtener("/margen?periodo=todo");

    expect(respuesta.body.margenPct).toBe(100);
    expect(sqls()[0]).toMatch(/pi\.costo_unitario IS NOT NULL/);
  });

  test("redondea a 2 decimales el dinero y a 1 decimal el porcentaje", async () => {
    baseDatos.query.mockResolvedValueOnce(totales("0.30000000000000004", "0.30000000000000004", "0.1")).mockResolvedValueOnce([[]]);

    const respuesta = await obtener("/margen?periodo=todo");

    expect(respuesta.body.ingresosTotales).toBe(0.3);
    expect(respuesta.body.ganancia).toBe(0.2);
    expect(respuesta.body.margenPct).toBe(66.7);
  });

  test("solo suma pedidos pagados y la lista de productos sin costo es solo de activos", async () => {
    baseDatos.query.mockResolvedValueOnce(totales("0", "0", "0")).mockResolvedValueOnce([[]]);

    await obtener("/margen?periodo=todo");

    const [sqlTotales, sqlSinCosto] = sqls();
    expect(sqlTotales).toMatch(/p\.estado = 'pagado'/);
    expect(sqlSinCosto).toMatch(/activo = 1 AND costo IS NULL/);
  });
});

describe("sin datos personales", () => {
  test("ninguna consulta de reportes lee datos del cliente ni de la direccion", async () => {
    baseDatos.query.mockResolvedValue([[{ ingresos_totales: 0, ingresos_con_costo: 0, costo: 0 }]]);

    await obtener("/mas-vendidos?periodo=todo");
    await obtener("/departamentos?periodo=todo");
    await obtener("/margen?periodo=todo");

    const todo = sqls().join("\n");
    expect(todo).not.toMatch(/\bp\.(nombre|email|telefono|cedula|direccion|agencia|comentario|ciudad)\b/);
    expect(todo).not.toMatch(/\b(email|telefono|cedula|direccion|agencia|comentario|mercadopago_id)\b/);
  });

  test("la respuesta solo trae los campos agregados esperados, aunque la base devuelva de mas", async () => {
    baseDatos.query.mockResolvedValue([
      [{ departamento: "Salto", pedidos: 2, ingresos: "10.00", nombre: "Juan Perez", telefono: "099123456", cedula: "12345678" }],
    ]);

    const respuesta = await obtener("/departamentos?periodo=todo");

    expect(Object.keys(respuesta.body.departamentos[0]).sort()).toEqual(["departamento", "ingresos", "pedidos"]);
    expect(JSON.stringify(respuesta.body)).not.toMatch(/Juan|099123456|12345678/);
  });
});

describe("errores internos", () => {
  test("un fallo de la base responde 500 generico sin detalles", async () => {
    baseDatos.query.mockRejectedValue(Object.assign(new Error("Access denied for user 'x'@'host'"), { code: "ER_ACCESS_DENIED" }));

    const respuesta = await obtener("/departamentos?periodo=todo");

    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({ mensaje: "error interno del servidor" });
  });
});
