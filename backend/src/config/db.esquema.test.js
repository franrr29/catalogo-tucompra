// mockeo mysql2 para no conectarme a ninguna base: solo se verifica que sentencias genera asegurarEsquema
const mockPool = {
  query: jest.fn(),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
};

jest.mock("mysql2/promise", () => ({
  createPool: jest.fn(() => mockPool),
}));

const baseDatos = require("./db");

const COLUMNAS_ENVIO = ["tipo_entrega", "cedula", "departamento", "ciudad", "direccion", "agencia", "comentario"];
const COLUMNAS_SEGUIMIENTO = ["estado_envio", "nro_seguimiento", "enviado_en"];

const ALTER_ENVIO =
  "ADD COLUMN tipo_entrega ENUM('domicilio','agencia') NULL, " +
  "ADD COLUMN cedula VARCHAR(10) NULL, " +
  "ADD COLUMN departamento VARCHAR(20) NULL, " +
  "ADD COLUMN ciudad VARCHAR(100) NULL, " +
  "ADD COLUMN direccion VARCHAR(200) NULL, " +
  "ADD COLUMN agencia VARCHAR(150) NULL, " +
  "ADD COLUMN comentario VARCHAR(300) NULL";

const ALTER_SEGUIMIENTO =
  "ADD COLUMN estado_envio ENUM('por_despachar','enviado','entregado') NULL, " +
  "ADD COLUMN nro_seguimiento VARCHAR(60) NULL, " +
  "ADD COLUMN enviado_en DATETIME NULL";

beforeEach(() => {
  mockPool.query.mockReset();
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
});

const filas = (...nombres) => [nombres.map((COLUMN_NAME) => ({ COLUMN_NAME }))];

// la primera consulta pregunta por productos.activo, la segunda por las columnas de pedidos
function simularBase({ activo = true, columnasPedidos }) {
  mockPool.query
    .mockResolvedValueOnce(activo ? filas("activo") : [[]])
    .mockResolvedValueOnce(filas(...columnasPedidos));
}

const sentenciasAlter = () =>
  mockPool.query.mock.calls.map(([sql]) => sql).filter((sql) => /ALTER TABLE/.test(sql));

test("base sin las columnas nuevas: las agrega todas en un unico ALTER", async () => {
  simularBase({ columnasPedidos: ["id", "nombre", "email", "telefono", "total", "estado"] });

  await baseDatos.asegurarEsquema();

  expect(sentenciasAlter()).toEqual([`ALTER TABLE pedidos ${ALTER_ENVIO}, ${ALTER_SEGUIMIENTO}`]);
});

test("base que ya tiene las de envio: agrega solo las de seguimiento", async () => {
  simularBase({ columnasPedidos: ["id", "nombre", ...COLUMNAS_ENVIO] });

  await baseDatos.asegurarEsquema();

  expect(sentenciasAlter()).toEqual([`ALTER TABLE pedidos ${ALTER_SEGUIMIENTO}`]);
});

test("es idempotente: si todas las columnas ya existen no ejecuta ningun ALTER", async () => {
  simularBase({ columnasPedidos: ["id", "nombre", ...COLUMNAS_ENVIO, ...COLUMNAS_SEGUIMIENTO] });

  await baseDatos.asegurarEsquema();

  expect(sentenciasAlter()).toEqual([]);
});

test("si falta solo alguna, agrega unicamente las que faltan", async () => {
  simularBase({
    columnasPedidos: ["id", "nombre", "tipo_entrega", "cedula", "departamento", "ciudad", "estado_envio"],
  });

  await baseDatos.asegurarEsquema();

  expect(sentenciasAlter()).toEqual([
    "ALTER TABLE pedidos " +
      "ADD COLUMN direccion VARCHAR(200) NULL, " +
      "ADD COLUMN agencia VARCHAR(150) NULL, " +
      "ADD COLUMN comentario VARCHAR(300) NULL, " +
      "ADD COLUMN nro_seguimiento VARCHAR(60) NULL, " +
      "ADD COLUMN enviado_en DATETIME NULL",
  ]);
});

test("las columnas nuevas aceptan null, asi los pedidos viejos siguen siendo validos", async () => {
  simularBase({ columnasPedidos: ["id"] });

  await baseDatos.asegurarEsquema();

  const alter = sentenciasAlter()[0];
  const columnas = alter.replace("ALTER TABLE pedidos ", "").split(", ");
  expect(columnas).toHaveLength(10);
  columnas.forEach((columna) => expect(columna).toMatch(/ NULL$/));
});
