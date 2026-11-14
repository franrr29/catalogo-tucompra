import "@testing-library/jest-dom";
import { render, screen, within, fireEvent } from "@testing-library/react";
import Rentabilidad from "./Rentabilidad";

const PRODUCTOS = [
  { id: 1, nombre: "Reloj A", precio: "100.00", stock: 3, costo: "60.00" },
  { id: 2, nombre: "Reloj B", precio: "50.00", stock: 0, costo: null },
  { id: 3, nombre: "Reloj C", precio: "80.00", stock: 1, costo: "0.00" },
  { id: 4, nombre: "Reloj D", precio: "100.00", stock: 1, costo: "125.00" },
];

const fila = (nombre) => screen.getByRole("row", { name: new RegExp(nombre) });

test("muestra precio, costo y margen por unidad de cada producto", () => {
  render(<Rentabilidad productos={PRODUCTOS} onEditar={() => {}} />);

  expect(fila("Reloj A")).toHaveTextContent("$100");
  expect(fila("Reloj A")).toHaveTextContent("$60");
  expect(fila("Reloj A")).toHaveTextContent("$40 · 40%");
});

test("un producto sin costo muestra 'Sin dato' (no un margen inventado) y el boton para cargarlo", () => {
  render(<Rentabilidad productos={PRODUCTOS} onEditar={() => {}} />);

  const filaB = fila("Reloj B");
  expect(within(filaB).getAllByText("Sin dato")).toHaveLength(2);
  expect(filaB).not.toHaveTextContent("%");
  expect(within(filaB).getByRole("button", { name: "Cargar costo de Reloj B" })).toBeInTheDocument();
});

test("un costo de 0 es un costo: margen 100% y boton Editar", () => {
  render(<Rentabilidad productos={PRODUCTOS} onEditar={() => {}} />);

  expect(fila("Reloj C")).toHaveTextContent("$80 · 100%");
  expect(within(fila("Reloj C")).getByRole("button", { name: "Editar costo de Reloj C" })).toBeInTheDocument();
});

test("un costo mayor que el precio se marca como perdida con texto, no solo con color", () => {
  render(<Rentabilidad productos={PRODUCTOS} onEditar={() => {}} />);

  expect(fila("Reloj D")).toHaveTextContent("(pérdida)");
  expect(fila("Reloj D")).toHaveTextContent("-25%");
});

test("avisa cuantos productos no tienen costo cargado", () => {
  render(<Rentabilidad productos={PRODUCTOS} onEditar={() => {}} />);

  expect(screen.getByText("1 sin costo cargado")).toBeInTheDocument();
});

test("con todos los costos cargados lo indica", () => {
  render(<Rentabilidad productos={PRODUCTOS.filter((p) => p.costo !== null)} onEditar={() => {}} />);

  expect(screen.getByText("Todos con costo")).toBeInTheDocument();
});

test("el boton abre el producto en el editor", () => {
  const onEditar = jest.fn();
  render(<Rentabilidad productos={PRODUCTOS} onEditar={onEditar} />);

  fireEvent.click(screen.getByRole("button", { name: "Cargar costo de Reloj B" }));

  expect(onEditar).toHaveBeenCalledWith(2);
});

test("es una tabla accesible: titulo, encabezados de columna y de fila", () => {
  render(<Rentabilidad productos={PRODUCTOS} onEditar={() => {}} />);

  expect(screen.getByRole("heading", { name: "Rentabilidad" })).toBeInTheDocument();
  expect(screen.getByRole("table", { name: /Precio, costo y margen/ })).toBeInTheDocument();
  expect(screen.getByRole("columnheader", { name: "Margen por unidad" })).toBeInTheDocument();
  expect(screen.getByRole("rowheader", { name: "Reloj A" })).toBeInTheDocument();
});

test("sin productos muestra un estado vacio", () => {
  render(<Rentabilidad productos={[]} onEditar={() => {}} />);

  expect(screen.getByText("Todavía no hay productos cargados.")).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
