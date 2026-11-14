import "@testing-library/jest-dom";
import { render, screen, fireEvent, within } from "@testing-library/react";
import CampanitaVentas from "./CampanitaVentas";

jest.mock(
  "react-router-dom",
  () => ({ Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }),
  { virtual: true }
);

const ULTIMOS = [
  { id: 15, fecha: "2026-11-13T09:00:00.000Z", nombre: "Ana Gomez", total: 300, ciudad: "Salto" },
  { id: 14, fecha: "2026-11-13T08:00:00.000Z", nombre: "Beto Silva", total: 80.5, ciudad: "Rivera" },
];

function montar(props = {}) {
  const onMarcarVistas = jest.fn();
  render(<CampanitaVentas cantidad={2} ultimos={ULTIMOS} onMarcarVistas={onMarcarVistas} {...props} />);
  return { onMarcarVistas };
}

const boton = () => screen.getByRole("button", { name: /Ventas nuevas/ });

test("muestra el contador en el boton", () => {
  montar();

  expect(boton()).toHaveAttribute("aria-label", "Ventas nuevas: 2");
  expect(boton()).toHaveTextContent("2");
  expect(boton()).toHaveAttribute("aria-expanded", "false");
});

test("sin ventas nuevas no hay contador", () => {
  montar({ cantidad: 0, ultimos: [] });

  expect(boton()).toHaveAttribute("aria-label", "Ventas nuevas: ninguna");
  expect(boton()).not.toHaveTextContent(/\d/);
});

test("con mas de 99 muestra 99+", () => {
  montar({ cantidad: 150 });

  expect(boton()).toHaveTextContent("99+");
});

test("al abrir lista las ultimas con nombre, total y ciudad, y cada una enlaza a envios", () => {
  montar();

  fireEvent.click(boton());

  const panel = screen.getByRole("region", { name: "Ventas nuevas" });
  expect(boton()).toHaveAttribute("aria-expanded", "true");
  expect(within(panel).getByText("Ana Gomez")).toBeInTheDocument();
  expect(within(panel).getByText("Salto")).toBeInTheDocument();
  expect(within(panel).getByText(/\$300/)).toBeInTheDocument();
  expect(within(panel).getByText("Beto Silva")).toBeInTheDocument();
  expect(within(panel).getByText("Rivera")).toBeInTheDocument();
  within(panel).getByText("Ana Gomez").closest("a");
  expect(within(panel).getByText("Ana Gomez").closest("a")).toHaveAttribute("href", "/admin/envios");
  expect(within(panel).getByRole("link", { name: "Ver envíos" })).toHaveAttribute("href", "/admin/envios");
});

test("si hay mas ventas nuevas que las que se listan, avisa cuantas faltan", () => {
  montar({ cantidad: 12 });

  fireEvent.click(boton());

  expect(screen.getByText("y 10 más")).toBeInTheDocument();
});

test("Marcar como vistas llama al manejador", () => {
  const { onMarcarVistas } = montar();
  fireEvent.click(boton());

  fireEvent.click(screen.getByRole("button", { name: "Marcar como vistas" }));

  expect(onMarcarVistas).toHaveBeenCalledTimes(1);
});

test("sin ventas nuevas el desplegable lo dice y no ofrece marcar como vistas", () => {
  montar({ cantidad: 0, ultimos: [] });

  fireEvent.click(boton());

  expect(screen.getByText("No hay ventas nuevas.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Marcar como vistas" })).not.toBeInTheDocument();
});

test("Escape lo cierra y devuelve el foco al boton", () => {
  montar();
  fireEvent.click(boton());

  fireEvent.keyDown(window, { key: "Escape" });

  expect(screen.queryByRole("region", { name: "Ventas nuevas" })).not.toBeInTheDocument();
  expect(boton()).toHaveFocus();
});

test("tocar fuera lo cierra", () => {
  montar();
  fireEvent.click(boton());

  fireEvent.mouseDown(document.body);

  expect(screen.queryByRole("region", { name: "Ventas nuevas" })).not.toBeInTheDocument();
});

test("tocar una venta lo cierra", () => {
  montar();
  fireEvent.click(boton());

  fireEvent.click(screen.getByText("Ana Gomez"));

  expect(screen.queryByRole("region", { name: "Ventas nuevas" })).not.toBeInTheDocument();
});
