import { renderHook, act } from "@testing-library/react";
import { useFotosPendientes } from "./useFotosPendientes";
import * as adminService from "../../../services/admin.service";

jest.mock("../../../services/admin.service");

const archivos = () => [
  new File(["a"], "a.png", { type: "image/png" }),
  new File(["b"], "b.png", { type: "image/png" }),
];

let onUnauthorized;

beforeEach(() => {
  onUnauthorized = jest.fn();
  adminService.subirImagenes.mockReset();
});

// activo = null: no se generan previews (jsdom no tiene URL.createObjectURL)
function montar() {
  return renderHook(() => useFotosPendientes(null, onUnauthorized));
}

function elegirFotos(result) {
  act(() => {
    result.current.setFotosSeleccionadas(archivos());
  });
}

test("sin fotos elegidas devuelve true y no hace ningun pedido", async () => {
  const { result } = montar();

  let resultado;
  await act(async () => {
    resultado = await result.current.subir(3);
  });

  expect(resultado).toBe(true);
  expect(adminService.subirImagenes).not.toHaveBeenCalled();
});

test("sube todas las fotos en un FormData, devuelve true y limpia la seleccion", async () => {
  adminService.subirImagenes.mockResolvedValue({});
  const { result } = montar();
  elegirFotos(result);

  let resultado;
  await act(async () => {
    resultado = await result.current.subir(3);
  });

  expect(resultado).toBe(true);
  const [productoId, formData] = adminService.subirImagenes.mock.calls[0];
  expect(productoId).toBe(3);
  expect(formData.getAll("imagenes")).toHaveLength(2);
  expect(result.current.fotosSeleccionadas).toBeNull();
  expect(onUnauthorized).not.toHaveBeenCalled();
});

test("un 401 en la subida cierra la sesion, devuelve false y limpia la seleccion", async () => {
  adminService.subirImagenes.mockRejectedValue({ response: { status: 401 } });
  const { result } = montar();
  elegirFotos(result);

  let resultado;
  await act(async () => {
    resultado = await result.current.subir(3);
  });

  expect(resultado).toBe(false);
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
  expect(result.current.fotosSeleccionadas).toBeNull();
});

test("otro error (500) se lanza para que el Dashboard avise y no cierra la sesion", async () => {
  adminService.subirImagenes.mockRejectedValue({ response: { status: 500, data: { mensaje: "error upload" } } });
  const { result } = montar();
  elegirFotos(result);

  await act(async () => {
    await expect(result.current.subir(3)).rejects.toMatchObject({ response: { status: 500 } });
  });

  expect(onUnauthorized).not.toHaveBeenCalled();
  expect(result.current.fotosSeleccionadas).toBeNull();
});
