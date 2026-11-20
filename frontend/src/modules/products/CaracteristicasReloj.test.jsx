import { render, screen } from "@testing-library/react";
import CaracteristicasReloj, { esReloj } from "./CaracteristicasReloj";

describe("esReloj", () => {
  test.each(["Relojes", "reloj", " RELOJES "])("detecta la categoria %p", (categoria) => {
    expect(esReloj({ categoria })).toBe(true);
  });

  test.each([{ categoria: "Tecnologia" }, { categoria: null }, {}, undefined])("no es reloj: %p", (producto) => {
    expect(esReloj(producto)).toBe(false);
  });
});

describe("CaracteristicasReloj", () => {
  test("muestra las 7 caracteristicas en negrita y la promo destacada", () => {
    render(<CaracteristicasReloj />);

    expect(screen.getAllByRole("listitem")).toHaveLength(7);
    expect(screen.getByText("Reloj con luz LED").tagName).toBe("STRONG");
    expect(screen.getByText(/\(no sumergible\)/)).toBeTruthy();
    expect(screen.getByText("Llevando 2 unidades, promo con descuento").tagName).toBe("STRONG");
  });
});
