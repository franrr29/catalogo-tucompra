import { renderHook, act, waitFor } from "@testing-library/react";
import { useProductosAdmin } from "./useProductosAdmin";
import * as adminService from "../../../services/admin.service";

jest.mock("../../../services/admin.service");

const PRODUCTOS = [
  { id: 1, nombre: "Reloj", precio: "100.00", stock: 3, costo: "60.00" },
  { id: 2, nombre: "Correa", precio: "50.00", stock: 0, costo: null },
];

let onUnauthorized;

beforeEach(() => {
  onUnauthorized = jest.fn();
  Object.values(adminService).forEach((fn) => fn.mockReset?.());
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

test("carga la lista del endpoint del panel, con el costo", async () => {
  adminService.obtenerProductosAdmin.mockResolvedValue(PRODUCTOS);

  const { result } = renderHook(() => useProductosAdmin(onUnauthorized));

  await waitFor(() => expect(result.current.productos).toEqual(PRODUCTOS));
  expect(adminService.obtenerProductosAdmin).toHaveBeenCalledTimes(1);
});

test("una respuesta que no es lista deja la lista vacia", async () => {
  adminService.obtenerProductosAdmin.mockResolvedValue({ mensaje: "raro" });

  const { result } = renderHook(() => useProductosAdmin(onUnauthorized));

  await waitFor(() => expect(adminService.obtenerProductosAdmin).toHaveBeenCalled());
  expect(result.current.productos).toEqual([]);
});

test("401 al cargar la lista cierra la sesion una sola vez", async () => {
  adminService.obtenerProductosAdmin.mockRejectedValue({ response: { status: 401 } });

  renderHook(() => useProductosAdmin(onUnauthorized));

  await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
  expect(adminService.obtenerProductosAdmin).toHaveBeenCalledTimes(1);
});

test("otro error no cierra la sesion: solo se registra y la lista queda vacia", async () => {
  adminService.obtenerProductosAdmin.mockRejectedValue({ response: { status: 500 } });

  const { result } = renderHook(() => useProductosAdmin(onUnauthorized));

  await waitFor(() => expect(console.error).toHaveBeenCalled());
  expect(onUnauthorized).not.toHaveBeenCalled();
  expect(result.current.productos).toEqual([]);
});

test("aunque el padre pase una funcion nueva en cada render, la lista no se vuelve a pedir en bucle", async () => {
  adminService.obtenerProductosAdmin.mockResolvedValue(PRODUCTOS);

  const { result, rerender } = renderHook(() => useProductosAdmin(() => {}));
  await waitFor(() => expect(result.current.productos).toHaveLength(2));

  rerender();
  rerender();

  expect(adminService.obtenerProductosAdmin).toHaveBeenCalledTimes(1);
});

test("actualizar un producto manda los datos (incluido el costo) y recarga la lista", async () => {
  adminService.obtenerProductosAdmin.mockResolvedValue(PRODUCTOS);
  adminService.actualizarProducto.mockResolvedValue({});

  const { result } = renderHook(() => useProductosAdmin(onUnauthorized));
  await waitFor(() => expect(result.current.productos).toHaveLength(2));

  let ok;
  await act(async () => {
    ok = await result.current.actualizarProducto(1, { costo: "55" });
  });

  expect(ok).toBe(true);
  expect(adminService.actualizarProducto).toHaveBeenCalledWith(1, { costo: "55" });
  expect(adminService.obtenerProductosAdmin).toHaveBeenCalledTimes(2);
});

test("un 401 al actualizar cierra la sesion y devuelve false", async () => {
  adminService.obtenerProductosAdmin.mockResolvedValue(PRODUCTOS);
  adminService.actualizarProducto.mockRejectedValue({ response: { status: 401 } });

  const { result } = renderHook(() => useProductosAdmin(onUnauthorized));
  await waitFor(() => expect(result.current.productos).toHaveLength(2));

  let ok;
  await act(async () => {
    ok = await result.current.actualizarProducto(1, { costo: "55" });
  });

  expect(ok).toBe(false);
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
});
