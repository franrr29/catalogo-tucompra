import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Checkout from "./Checkout";
import * as pedidosService from "../../services/pedidos.service";

jest.mock("../../services/pedidos.service");

// este jest no resuelve react-router-dom v7, asi que se mockea solo lo que usa Checkout
jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      Link: ({ to, children, ...resto }) => React.createElement("a", { href: to, ...resto }, children),
    };
  },
  { virtual: true }
);

const CARRITO = [{ id: 1, nombre: "G-Shock", precio: "100.00", cantidad: 2 }];

const etiqueta = (texto) => screen.getByLabelText(texto);
const escribir = (texto, valor) => fireEvent.change(etiqueta(texto), { target: { value: valor } });
const enviar = () => fireEvent.click(screen.getByRole("button", { name: /Pagar con Mercado Pago/i }));

// completa los campos obligatorios de un envio a domicilio
function completarDomicilio() {
  escribir(/Nombre de quien recibe/i, "  Juan Pérez ");
  escribir(/^Email/i, "juan@mail.com");
  escribir(/^Teléfono/i, "099 123 456");
  escribir(/^Departamento/i, "Montevideo");
  escribir(/Ciudad/i, "Pocitos");
  escribir(/^Dirección/i, "Av. Brasil 1234 apto 5");
}

let ubicacionOriginal;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("productos", JSON.stringify(CARRITO));
  pedidosService.crearPago.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});

  // jsdom no navega: se reemplaza location para poder ver a donde se redirige
  ubicacionOriginal = window.location;
  delete window.location;
  window.location = { href: "http://localhost/checkout" };
});

afterEach(() => {
  window.location = ubicacionOriginal;
  console.error.mockRestore();
});

test("carrito vacío: no muestra el formulario", () => {
  localStorage.setItem("productos", "[]");
  render(<Checkout />);

  expect(screen.getByText("No hay productos para pagar")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Pagar con Mercado Pago/i })).not.toBeInTheDocument();
});

test("muestra los campos, el aviso de privacidad y por defecto pide dirección", () => {
  render(<Checkout />);

  expect(etiqueta(/Nombre de quien recibe/i)).toBeInTheDocument();
  expect(etiqueta(/Cédula de identidad/i)).toBeInTheDocument();
  expect(screen.getByText("Usamos tus datos solo para gestionar el envío.")).toBeInTheDocument();
  expect(etiqueta(/^Dirección/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/Agencia o sucursal/i)).not.toBeInTheDocument();
});

test("el departamento ofrece los 19 departamentos", () => {
  render(<Checkout />);

  const opciones = etiqueta(/^Departamento/i).querySelectorAll("option");
  expect(opciones).toHaveLength(20); // los 19 mas el "Elegí un departamento"
});

test("al elegir retiro en agencia se reemplaza la dirección por la agencia", () => {
  render(<Checkout />);

  fireEvent.click(etiqueta("Retiro en agencia"));

  expect(etiqueta(/Agencia o sucursal de retiro/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/^Dirección/i)).not.toBeInTheDocument();
});

test("enviar vacío no llama al backend, muestra los errores y enfoca el primer campo", () => {
  render(<Checkout />);

  enviar();

  expect(pedidosService.crearPago).not.toHaveBeenCalled();
  expect(screen.getByText("Ingresá el nombre de quien recibe.")).toBeInTheDocument();
  expect(screen.getByText("Elegí un departamento.")).toBeInTheDocument();
  expect(screen.getByText("Ingresá la dirección de entrega.")).toBeInTheDocument();
  expect(etiqueta(/Nombre de quien recibe/i)).toHaveFocus();
});

test("antes de enviar, el error de un campo aparece recién cuando se sale de él", () => {
  render(<Checkout />);

  expect(screen.queryByText("Ingresá un email válido.")).not.toBeInTheDocument();

  escribir(/^Email/i, "juan@");
  expect(screen.queryByText("Ingresá un email válido.")).not.toBeInTheDocument();

  fireEvent.blur(etiqueta(/^Email/i));
  expect(screen.getByText("Ingresá un email válido.")).toBeInTheDocument();
});

test("envío a domicilio válido: manda solo los datos, guarda el pedido y redirige a mercado pago", async () => {
  pedidosService.crearPago.mockResolvedValue({ pedido: { id: 55, init_point: "https://mp.test/pagar" } });
  render(<Checkout />);

  completarDomicilio();
  escribir(/Comentario/i, "casa con rejas");
  enviar();

  await waitFor(() => expect(window.location.href).toBe("https://mp.test/pagar"));
  expect(pedidosService.crearPago).toHaveBeenCalledWith({
    nombre: "Juan Pérez",
    email: "juan@mail.com",
    telefono: "099 123 456",
    items: [{ productoId: 1, cantidad: 2 }],
    envio: {
      tipoEntrega: "domicilio",
      cedula: "",
      departamento: "Montevideo",
      ciudad: "Pocitos",
      direccion: "Av. Brasil 1234 apto 5",
      comentario: "casa con rejas",
    },
  });
  expect(localStorage.getItem("pedidoId")).toBe("55");
});

test("retiro en agencia válido: manda la agencia y no la dirección", async () => {
  pedidosService.crearPago.mockResolvedValue({ pedido: { id: 56, init_point: "https://mp.test/pagar" } });
  render(<Checkout />);

  fireEvent.click(etiqueta("Retiro en agencia"));
  escribir(/Nombre de quien recibe/i, "Ana Gómez");
  escribir(/^Email/i, "ana@mail.com");
  escribir(/^Teléfono/i, "099123456");
  escribir(/^Departamento/i, "Salto");
  escribir(/Ciudad/i, "Salto");
  escribir(/Agencia o sucursal de retiro/i, "DAC centro");
  enviar();

  await waitFor(() => expect(pedidosService.crearPago).toHaveBeenCalledTimes(1));
  const { envio } = pedidosService.crearPago.mock.calls[0][0];
  expect(envio.agencia).toBe("DAC centro");
  expect(envio).not.toHaveProperty("direccion");
});

test("el comentario muestra el contador y no pasa de 300 caracteres", () => {
  render(<Checkout />);

  const comentario = etiqueta(/Comentario/i);
  expect(comentario).toHaveAttribute("maxLength", "300");

  escribir(/Comentario/i, "hola");
  expect(screen.getByText("4/300")).toBeInTheDocument();
});

test("un error del backend sobre un campo se muestra en ese campo y se limpia al editarlo", async () => {
  pedidosService.crearPago.mockRejectedValue({
    response: { status: 400, data: { mensaje: "el telefono no es valido", campo: "telefono" } },
  });
  render(<Checkout />);

  completarDomicilio();
  enviar();

  expect(await screen.findByText("el telefono no es valido")).toBeInTheDocument();
  expect(etiqueta(/^Teléfono/i)).toHaveFocus();

  escribir(/^Teléfono/i, "099123457");
  expect(screen.queryByText("el telefono no es valido")).not.toBeInTheDocument();
});

test("un error del backend sin campo (por ejemplo falta de stock) se muestra en un aviso", async () => {
  pedidosService.crearPago.mockRejectedValue({
    response: { status: 400, data: { mensaje: "Stock insuficiente para G-Shock" } },
  });
  render(<Checkout />);

  completarDomicilio();
  enviar();

  expect(await screen.findByText("Stock insuficiente para G-Shock")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Pagar con Mercado Pago/i })).toBeEnabled();
});

test("un 500 muestra un mensaje genérico y no el del servidor", async () => {
  pedidosService.crearPago.mockRejectedValue({
    response: { status: 500, data: { mensaje: "error interno del servidor" } },
  });
  render(<Checkout />);

  completarDomicilio();
  enviar();

  expect(await screen.findByText("No pudimos iniciar el pago. Intenta nuevamente.")).toBeInTheDocument();
});

test("no escribe datos personales en la consola cuando falla el pedido", async () => {
  pedidosService.crearPago.mockRejectedValue({
    config: { data: JSON.stringify({ nombre: "Juan Pérez", envio: { direccion: "Av. Brasil 1234" } }) },
    response: { status: 500, data: { mensaje: "error interno del servidor" } },
  });
  render(<Checkout />);

  completarDomicilio();
  enviar();

  await screen.findByText("No pudimos iniciar el pago. Intenta nuevamente.");
  const consola = JSON.stringify(console.error.mock.calls);
  expect(consola).not.toContain("Juan");
  expect(consola).not.toContain("Brasil");
});
