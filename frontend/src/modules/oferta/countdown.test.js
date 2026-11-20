import { getTimeLeft, DURACION_OFERTA_MS } from "./countdown";

describe("getTimeLeft", () => {
  const ahora = 1_000_000_000_000;

  test("desglosa dias, horas, minutos y segundos", () => {
    const fin = ahora + ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000;
    expect(getTimeLeft(fin, ahora)).toEqual({
      days: 2, hours: 3, minutes: 4, seconds: 5, isExpired: false,
    });
  });

  test("la duracion configurada es de 5 dias y 2 horas", () => {
    expect(getTimeLeft(ahora + DURACION_OFERTA_MS, ahora)).toMatchObject({ days: 5, hours: 2, minutes: 0, seconds: 0 });
  });

  test("justo en cero esta expirada", () => {
    expect(getTimeLeft(ahora, ahora)).toEqual({
      days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true,
    });
  });

  test("a un segundo de terminar todavia no expiro", () => {
    expect(getTimeLeft(ahora + 1000, ahora)).toMatchObject({ seconds: 1, isExpired: false });
  });

  test("ya expirada no devuelve valores negativos", () => {
    expect(getTimeLeft(ahora - 5000, ahora)).toEqual({
      days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true,
    });
  });
});
