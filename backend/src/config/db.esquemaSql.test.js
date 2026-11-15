// el esquema para crear una base nueva (baseDatos.sql) y asegurarEsquema() deben describir las mismas columnas:
// si alguien agrega una columna en uno y se olvida del otro, este test lo avisa
const fs = require("fs");
const path = require("path");

const mockPool = {
  query: jest.fn(),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
};
jest.mock("mysql2/promise", () => ({ createPool: jest.fn(() => mockPool) }));

const baseDatos = require("./db");

// columnas de cada CREATE TABLE de baseDatos.sql
function columnasDelSql() {
  const sql = fs.readFileSync(path.join(__dirname, "../../baseDatos.sql"), "utf8");
  const tablas = {};
  for (const [, nombre, cuerpo] of sql.matchAll(/CREATE TABLE (\w+) \(([\s\S]*?)\n\);/g)) {
    tablas[nombre] = cuerpo
      .split("\n")
      .map((linea) => linea.trim().match(/^(\w+)\s+(?:INT|VARCHAR|TEXT|DECIMAL|TINYINT|ENUM|DATETIME|TIMESTAMP)/i))
      .filter(Boolean)
      .map((coincidencia) => coincidencia[1]);
  }
  return tablas;
}

test("todas las columnas que agrega asegurarEsquema() estan en baseDatos.sql", async () => {
  // una base sin ninguna de las columnas: asegurarEsquema() las agrega todas
  mockPool.query.mockImplementation(async (sql) => {
    if (/^ALTER TABLE/.test(sql)) return [{}];
    return [[]];
  });
  jest.spyOn(console, "log").mockImplementation(() => {});

  await baseDatos.asegurarEsquema();

  const alters = mockPool.query.mock.calls.map(([sql]) => sql).filter((sql) => /^ALTER TABLE/.test(sql));
  expect(alters.length).toBeGreaterThan(0);

  const tablas = columnasDelSql();
  for (const alter of alters) {
    const tabla = alter.match(/^ALTER TABLE (\w+)/)[1];
    const agregadas = [...alter.matchAll(/ADD COLUMN (\w+)/g)].map((coincidencia) => coincidencia[1]);
    expect(agregadas.length).toBeGreaterThan(0);
    for (const columna of agregadas) {
      expect(tablas[tabla]).toContain(columna);
    }
  }
});

test("baseDatos.sql no trae sentencias que pisen datos", () => {
  const sql = fs.readFileSync(path.join(__dirname, "../../baseDatos.sql"), "utf8");
  expect(sql).not.toMatch(/^\s*(USE|DROP|TRUNCATE|DELETE|INSERT|CREATE DATABASE)\b/im);
});
