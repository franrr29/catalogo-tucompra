import {
  aNumero,
  costoComoTexto,
  mismoCosto,
  calcularMargen,
  costoMayorQuePrecio,
  costoInvalido,
  leerIdEditar,
} from "./costos";

describe("aNumero y costoComoTexto", () => {
  test("null, undefined, vacio y texto no numerico son costo desconocido (null), nunca 0", () => {
    [null, undefined, "", "   ", "abc"].forEach((valor) => expect(aNumero(valor)).toBeNull());
  });

  test("0 es un costo valido", () => {
    expect(aNumero(0)).toBe(0);
    expect(aNumero("0.00")).toBe(0);
    expect(costoComoTexto("0.00")).toBe("0");
  });

  test("convierte el costo de la base a texto de formulario", () => {
    expect(costoComoTexto("60.50")).toBe("60.5");
    expect(costoComoTexto(null)).toBe("");
    expect(costoComoTexto(undefined)).toBe("");
  });
});

describe("mismoCosto", () => {
  test("compara como numeros y trata los vacios como iguales entre si", () => {
    expect(mismoCosto("60.00", "60")).toBe(true);
    expect(mismoCosto(null, "")).toBe(true);
    expect(mismoCosto("60", "61")).toBe(false);
  });

  test("0 no es lo mismo que sin costo", () => {
    expect(mismoCosto(0, null)).toBe(false);
    expect(mismoCosto("0", "")).toBe(false);
  });
});

describe("calcularMargen", () => {
  test("ganancia por unidad y porcentaje sobre el precio", () => {
    expect(calcularMargen("100.00", "60.00")).toEqual({ ganancia: 40, porcentaje: 40 });
    expect(calcularMargen(150, 100)).toEqual({ ganancia: 50, porcentaje: 33.3 });
  });

  test("sin costo es sin dato (null), no 100%", () => {
    expect(calcularMargen("100.00", null)).toBeNull();
    expect(calcularMargen("100.00", "")).toBeNull();
  });

  test("costo 0 da 100% de margen", () => {
    expect(calcularMargen("100.00", "0.00")).toEqual({ ganancia: 100, porcentaje: 100 });
  });

  test("costo mayor que el precio da margen negativo", () => {
    expect(calcularMargen(100, 125)).toEqual({ ganancia: -25, porcentaje: -25 });
  });
});

describe("costoMayorQuePrecio", () => {
  test("solo avisa cuando ambos existen y el costo supera al precio", () => {
    expect(costoMayorQuePrecio("120", "100")).toBe(true);
    expect(costoMayorQuePrecio("100", "100")).toBe(false);
    expect(costoMayorQuePrecio("", "100")).toBe(false);
    expect(costoMayorQuePrecio("120", "")).toBe(false);
  });
});

describe("costoInvalido", () => {
  test("vacio y numeros desde 0 son validos", () => {
    ["", "  ", "0", "12.5", 7].forEach((valor) => expect(costoInvalido(valor)).toBe(false));
  });

  test("negativos y no numericos son invalidos", () => {
    ["-1", -5, "abc", "1,5x"].forEach((valor) => expect(costoInvalido(valor)).toBe(true));
  });
});

describe("leerIdEditar", () => {
  test("acepta solo enteros positivos", () => {
    expect(leerIdEditar("7")).toBe(7);
    expect(leerIdEditar("120")).toBe(120);
  });

  test.each([[null], [undefined], [""], ["0"], ["-3"], ["abc"], ["1.5"], ["1e3"], ["007"], [" 4"], ["9999999999999999999"], [["1"]]])(
    "ignora el valor invalido %p",
    (valor) => {
      expect(leerIdEditar(valor)).toBeNull();
    }
  );
});
