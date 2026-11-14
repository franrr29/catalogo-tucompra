import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import BarrasHorizontales from "./BarrasHorizontales";

const ITEMS = [
  { clave: "a", etiqueta: "Montevideo", valor: 1000, texto: "$1.000 · 4 pedidos" },
  { clave: "b", etiqueta: "Salto", valor: 250, texto: "$250 · 1 pedido" },
  { clave: "c", etiqueta: "Rivera", valor: 1, texto: "$1 · 1 pedido" },
];

// ancho de la barra de una fila (la barra esta oculta a lectores de pantalla)
const anchoDe = (etiqueta) => {
  const fila = screen.getByText(etiqueta).closest("li");
  return fila.querySelector('[aria-hidden="true"] > div').style.width;
};

test("el valor mayor ocupa todo el ancho y los demas son proporcionales", () => {
  render(<BarrasHorizontales items={ITEMS} ariaLabel="Ingresos" />);

  expect(anchoDe("Montevideo")).toBe("100%");
  expect(anchoDe("Salto")).toBe("25%");
});

test("un valor positivo muy chico muestra un minimo de barra para que se vea", () => {
  render(<BarrasHorizontales items={ITEMS} ariaLabel="Ingresos" />);

  expect(anchoDe("Rivera")).toBe("2%");
});

test("un valor 0 no dibuja barra y no rompe cuando todos son 0", () => {
  render(
    <BarrasHorizontales
      items={[{ clave: "a", etiqueta: "Nada", valor: 0, texto: "$0" }]}
      ariaLabel="Ingresos"
    />
  );

  expect(anchoDe("Nada")).toBe("0%");
});

test("el dato esta siempre escrito en texto y las barras quedan fuera del arbol de accesibilidad", () => {
  render(<BarrasHorizontales items={ITEMS} ariaLabel="Ingresos por departamento" />);

  const lista = screen.getByRole("list", { name: "Ingresos por departamento" });
  const filas = within(lista).getAllByRole("listitem");
  expect(filas).toHaveLength(3);
  expect(filas[0]).toHaveTextContent("Montevideo");
  expect(filas[0]).toHaveTextContent("$1.000 · 4 pedidos");
  filas.forEach((fila) => expect(fila.querySelector('[aria-hidden="true"]')).not.toBeNull());
});
