import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Exito, { REINTENTOS_PENDIENTE } from "./Exito";
import * as pedidosService from "../../services/pedidos.service";

jest.mock("../../services/pedidos.service");

// este jest no resuelve react-router-dom v7, asi que se mockea solo lo que usa Exito
let mockQuery = "";
jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      Link: ({ to, children, ...resto }) => React.createElement("a", { href: to, ...resto }, children),
      useSearchParams: () => [new URLSearchParams(mockQuery)],
    };
  },
  { virtual: true }
);

const CARRITO = [{ id: 1, nombre: "G-Shock", precio: 100, cantidad: 2 }];

function montar({ url = "/pago-exitoso?external_reference=12", setCarrito = jest.fn() } = {}) {
  mockQuery = url.split("?")[1] || "";
  render(<Exito setCarrito={setCarrito} esperaMs={1} />);
  return setCarrito;
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("productos", JSON.stringify(CARRITO));
  pedidosService.obtenerEstadoPedido.mockReset();
});

test("pedido pagado: muestra el exito, vacia el carrito y ofrece WhatsApp", async () => {
  pedidosService.obtenerEstadoPedido.mockResolvedValue("pagado");
  const setCarrito = montar();

  expect(await screen.findByText("EXITOSO")).toBeInTheDocument();
  expect(pedidosService.obtenerEstadoPedido).toHaveBeenCalledWith("12");
  expect(setCarrito).toHaveBeenCalledWith([]);
  expect(localStorage.getItem("productos")).toBeNull();
  expect(screen.getByText("Contactar por WhatsApp")).toBeInTheDocument();
});

test("pedido pendiente: reintenta unas pocas veces, termina sin bucle y no vacia el carrito", async () => {
  pedidosService.obtenerEstadoPedido.mockResolvedValue("pendiente");
  const setCarrito = montar();

  expect(await screen.findByText("Verificar de nuevo")).toBeInTheDocument();
  expect(pedidosService.obtenerEstadoPedido).toHaveBeenCalledTimes(1 + REINTENTOS_PENDIENTE);
  expect(setCarrito).not.toHaveBeenCalled();
  expect(localStorage.getItem("productos")).not.toBeNull();
  expect(screen.queryByText("EXITOSO")).not.toBeInTheDocument();
  expect(screen.queryByText("Contactar por WhatsApp")).not.toBeInTheDocument();
});

test("pendiente y despues pagado: confirma y vacia el carrito", async () => {
  pedidosService.obtenerEstadoPedido
    .mockResolvedValueOnce("pendiente")
    .mockResolvedValueOnce("pendiente")
    .mockResolvedValueOnce("pagado");
  const setCarrito = montar();

  expect(await screen.findByText("EXITOSO")).toBeInTheDocument();
  expect(pedidosService.obtenerEstadoPedido).toHaveBeenCalledTimes(3);
  expect(setCarrito).toHaveBeenCalledWith([]);
  expect(localStorage.getItem("productos")).toBeNull();
});

test("pedido cancelado: no muestra exito ni vacia el carrito", async () => {
  pedidosService.obtenerEstadoPedido.mockResolvedValue("cancelado");
  const setCarrito = montar();

  expect(await screen.findByText("CANCELADO")).toBeInTheDocument();
  expect(screen.queryByText("EXITOSO")).not.toBeInTheDocument();
  expect(setCarrito).not.toHaveBeenCalled();
  expect(localStorage.getItem("productos")).not.toBeNull();
  expect(screen.getByText("Volver al carrito")).toBeInTheDocument();
});

test("error de red: mensaje claro, no vacia el carrito y permite reintentar", async () => {
  pedidosService.obtenerEstadoPedido.mockRejectedValue(new Error("Network Error"));
  const setCarrito = montar();

  expect(await screen.findByText("VERIFICAR")).toBeInTheDocument();
  expect(setCarrito).not.toHaveBeenCalled();
  expect(localStorage.getItem("productos")).not.toBeNull();

  pedidosService.obtenerEstadoPedido.mockResolvedValue("pagado");
  fireEvent.click(screen.getByText("Verificar de nuevo"));

  expect(await screen.findByText("EXITOSO")).toBeInTheDocument();
  expect(setCarrito).toHaveBeenCalledWith([]);
});

test("pedido que no existe (404): no muestra exito ni vacia el carrito", async () => {
  pedidosService.obtenerEstadoPedido.mockRejectedValue({ response: { status: 404 } });
  const setCarrito = montar();

  expect(await screen.findByText("NO ENCONTRADO")).toBeInTheDocument();
  expect(setCarrito).not.toHaveBeenCalled();
  expect(localStorage.getItem("productos")).not.toBeNull();
});

test("entrar a la ruta sin id de pedido no cuenta como pago: no consulta ni vacia el carrito", async () => {
  const setCarrito = montar({ url: "/pago-exitoso" });

  expect(await screen.findByText("NO IDENTIFICADO")).toBeInTheDocument();
  expect(pedidosService.obtenerEstadoPedido).not.toHaveBeenCalled();
  expect(setCarrito).not.toHaveBeenCalled();
  expect(localStorage.getItem("productos")).not.toBeNull();
});

test("un external_reference que no es un numero se ignora", async () => {
  montar({ url: "/pago-exitoso?external_reference=abc" });

  expect(await screen.findByText("NO IDENTIFICADO")).toBeInTheDocument();
  expect(pedidosService.obtenerEstadoPedido).not.toHaveBeenCalled();
});

test("si la url no trae id se usa el pedido guardado por el checkout", async () => {
  localStorage.setItem("pedidoId", "34");
  pedidosService.obtenerEstadoPedido.mockResolvedValue("pagado");
  montar({ url: "/pago-exitoso" });

  await waitFor(() => expect(pedidosService.obtenerEstadoPedido).toHaveBeenCalledWith("34"));
  expect(await screen.findByText("EXITOSO")).toBeInTheDocument();
  expect(localStorage.getItem("pedidoId")).toBeNull();
});

test("el id de la url tiene prioridad sobre el guardado", async () => {
  localStorage.setItem("pedidoId", "34");
  pedidosService.obtenerEstadoPedido.mockResolvedValue("cancelado");
  montar({ url: "/pago-exitoso?external_reference=12" });

  await screen.findByText("CANCELADO");
  expect(pedidosService.obtenerEstadoPedido).toHaveBeenCalledWith("12");
});
