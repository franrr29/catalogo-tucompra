import { renderHook, act, waitFor } from "@testing-library/react";
import { useReportesAdmin } from "./useReportesAdmin";
import * as adminService from "../../../services/admin.service";

jest.mock("../../../services/admin.service");

const MARGEN = { periodo: "mes", ingresosTotales: 1000, ganancia: 300, margenPct: 37.5, productosSinCosto: [] };
const MAS_VENDIDOS = { periodo: "mes", orden: "unidades", productos: [{ productoId: 1, nombre: "Reloj", unidades: 3 }] };
const DEPARTAMENTOS = { periodo: "mes", departamentos: [{ departamento: "Salto", pedidos: 1, ingresos: 10 }] };

let onUnauthorized;

beforeEach(() => {
  onUnauthorized = jest.fn();
  adminService.obtenerMargen.mockReset().mockResolvedValue(MARGEN);
  adminService.obtenerMasVendidos.mockReset().mockResolvedValue(MAS_VENDIDOS);
  adminService.obtenerVentasPorDepartamento.mockReset().mockResolvedValue(DEPARTAMENTOS);
});

const montar = () => renderHook(() => useReportesAdmin(onUnauthorized));
const esperarCarga = (result) =>
  waitFor(() => {
    expect(result.current.margen.cargando).toBe(false);
    expect(result.current.masVendidos.cargando).toBe(false);
    expect(result.current.departamentos.cargando).toBe(false);
  });

test("al montar pide los tres reportes de este mes, ordenando por unidades", async () => {
  const { result } = montar();

  expect(result.current.margen.cargando).toBe(true);
  await esperarCarga(result);

  expect(adminService.obtenerMargen).toHaveBeenCalledWith({ periodo: "mes" });
  expect(adminService.obtenerMasVendidos).toHaveBeenCalledWith({ periodo: "mes", orden: "unidades" });
  expect(adminService.obtenerVentasPorDepartamento).toHaveBeenCalledWith({ periodo: "mes" });
  expect(result.current.margen.datos).toEqual(MARGEN);
  expect(result.current.masVendidos.datos).toEqual(MAS_VENDIDOS);
  expect(result.current.departamentos.datos).toEqual(DEPARTAMENTOS);
});

test("cambiar el periodo vuelve a pedir los tres reportes y no muestra datos del periodo anterior mientras carga", async () => {
  const { result } = montar();
  await esperarCarga(result);

  act(() => result.current.cambiarPeriodo("30dias"));

  expect(result.current.periodo).toBe("30dias");
  expect(result.current.margen).toMatchObject({ cargando: true, datos: null });
  await esperarCarga(result);
  expect(adminService.obtenerMargen).toHaveBeenLastCalledWith({ periodo: "30dias" });
  expect(adminService.obtenerMasVendidos).toHaveBeenLastCalledWith({ periodo: "30dias", orden: "unidades" });
  expect(adminService.obtenerVentasPorDepartamento).toHaveBeenLastCalledWith({ periodo: "30dias" });
});

test("cambiar el orden solo vuelve a pedir los mas vendidos", async () => {
  const { result } = montar();
  await esperarCarga(result);

  act(() => result.current.cambiarOrden("ingresos"));
  await esperarCarga(result);

  expect(adminService.obtenerMasVendidos).toHaveBeenLastCalledWith({ periodo: "mes", orden: "ingresos" });
  expect(adminService.obtenerMasVendidos).toHaveBeenCalledTimes(2);
  expect(adminService.obtenerMargen).toHaveBeenCalledTimes(1);
  expect(adminService.obtenerVentasPorDepartamento).toHaveBeenCalledTimes(1);
});

test("una respuesta lenta de un periodo anterior no pisa la del periodo actual", async () => {
  let resolverLenta;
  adminService.obtenerMargen
    .mockReturnValueOnce(new Promise((resolver) => { resolverLenta = resolver; }))
    .mockResolvedValue({ ...MARGEN, periodo: "todo", ingresosTotales: 5 });
  const { result } = montar();

  act(() => result.current.cambiarPeriodo("todo"));
  await waitFor(() => expect(result.current.margen.datos?.periodo).toBe("todo"));

  await act(async () => {
    resolverLenta({ ...MARGEN, periodo: "mes", ingresosTotales: 999 });
  });

  expect(result.current.margen.datos.periodo).toBe("todo");
});

test("un 401 cierra la sesion una sola vez aunque fallen los tres pedidos, y no muestra error", async () => {
  const sinSesion = { response: { status: 401 } };
  adminService.obtenerMargen.mockRejectedValue(sinSesion);
  adminService.obtenerMasVendidos.mockRejectedValue(sinSesion);
  adminService.obtenerVentasPorDepartamento.mockRejectedValue(sinSesion);

  const { result } = montar();
  await esperarCarga(result);

  expect(onUnauthorized).toHaveBeenCalledTimes(1);
  expect(result.current.margen.error).toBeNull();
  expect(result.current.masVendidos.error).toBeNull();
});

test("otro error se muestra solo en su seccion y se puede reintentar", async () => {
  adminService.obtenerMasVendidos.mockRejectedValueOnce({ response: { status: 500 } });
  const { result } = montar();
  await esperarCarga(result);

  expect(result.current.masVendidos.error).toBe("No se pudo cargar el ranking de más vendidos.");
  expect(result.current.margen.error).toBeNull();
  expect(result.current.departamentos.error).toBeNull();
  expect(onUnauthorized).not.toHaveBeenCalled();

  act(() => result.current.masVendidos.reintentar());
  await waitFor(() => expect(result.current.masVendidos.datos).toEqual(MAS_VENDIDOS));
  expect(result.current.masVendidos.error).toBeNull();
  expect(adminService.obtenerMargen).toHaveBeenCalledTimes(1);
});

test("usa el mensaje que manda el backend si lo hay", async () => {
  adminService.obtenerMargen.mockRejectedValue({ response: { status: 400, data: { mensaje: "periodo invalido" } } });

  const { result } = montar();
  await esperarCarga(result);

  expect(result.current.margen.error).toBe("periodo invalido");
});

test("aunque el padre pase una funcion nueva en cada render, los reportes no se piden en bucle", async () => {
  const { result, rerender } = renderHook(() => useReportesAdmin(() => {}));
  await esperarCarga(result);

  rerender();
  rerender();

  expect(adminService.obtenerMargen).toHaveBeenCalledTimes(1);
  expect(adminService.obtenerMasVendidos).toHaveBeenCalledTimes(1);
  expect(adminService.obtenerVentasPorDepartamento).toHaveBeenCalledTimes(1);
});
