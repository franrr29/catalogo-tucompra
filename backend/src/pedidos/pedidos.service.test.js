process.env.MP_ACCESS_TOKEN = "test-token";

// mockeo la base de datos para no conectarme a la real durante los tests
jest.mock("../config/db", () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

const { crearPedidoService } = require("./pedidos.service");

test("lanza error si la cantidad es negativa", async () => {
  await expect(
    crearPedidoService("Juan", "juan@mail.com", "099123456", [
      { productoId: 1, cantidad: -5 },
    ])
  ).rejects.toThrow("La cantidad debe ser un numero entero mayor a 0");
});

test("lanza error si la cantidad es cero", async () => {
  await expect(
    crearPedidoService("Juan", "juan@mail.com", "099123456", [
      { productoId: 1, cantidad: 0 },
    ])
  ).rejects.toThrow("La cantidad debe ser un numero entero mayor a 0");
});

test("lanza error si la cantidad es decimal", async () => {
  await expect(
    crearPedidoService("Juan", "juan@mail.com", "099123456", [
      { productoId: 1, cantidad: 1.5 },
    ])
  ).rejects.toThrow("La cantidad debe ser un numero entero mayor a 0");
});

test("lanza error si la cantidad es un string", async () => {
  await expect(
    crearPedidoService("Juan", "juan@mail.com", "099123456", [
      { productoId: 1, cantidad: "5" },
    ])
  ).rejects.toThrow("La cantidad debe ser un numero entero mayor a 0");
});
