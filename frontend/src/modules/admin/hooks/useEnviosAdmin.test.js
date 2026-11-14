import { renderHook, act, waitFor } from "@testing-library/react";
import { useEnviosAdmin } from "./useEnviosAdmin";
import * as adminService from "../../../services/admin.service";

jest.mock("../../../services/admin.service");

const listado = (pedidos = [], extra = {}) => ({ pedidos, pagina: 1, limite: 20, total: pedidos.length, totalPaginas: 1, ...extra });
const pedido = (id) => ({ id, fecha: "2026-11-10T15:30:00.000Z", nombre: `Cliente ${id}`, estadoEnvio: "por_despachar" });
const detalle = (id) => ({ id, cliente: {}, envio: { estadoEnvio: "por_despachar" } });

let onUnauthorized;

beforeEach(() => {
  onUnauthorized = jest.fn();
  adminService.listarPedidos.mockReset();
  adminService.obtenerPedido.mockReset();
  adminService.actualizarEnvio.mockReset();
});

const montar = () => renderHook(() => useEnviosAdmin(onUnauthorized));

describe("listado", () => {
  test("al abrir pide los pedidos por despachar de la primera pagina", async () => {
    adminService.listarPedidos.mockResolvedValue(listado([pedido(1)]));
    const { result } = montar();

    expect(result.current.cargando).toBe(true);
    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(adminService.listarPedidos).toHaveBeenCalledWith({ estadoEnvio: "por_despachar", pagina: 1 });
    expect(result.current.listado.pedidos).toHaveLength(1);
  });

  test("cambiar el filtro vuelve a la primera pagina", async () => {
    adminService.listarPedidos.mockResolvedValue(listado([pedido(1)], { totalPaginas: 3 }));
    const { result } = montar();
    await waitFor(() => expect(result.current.cargando).toBe(false));

    act(() => result.current.cambiarPagina(2));
    await waitFor(() => expect(adminService.listarPedidos).toHaveBeenLastCalledWith({ estadoEnvio: "por_despachar", pagina: 2 }));

    act(() => result.current.cambiarFiltro("enviado"));
    await waitFor(() => expect(adminService.listarPedidos).toHaveBeenLastCalledWith({ estadoEnvio: "enviado", pagina: 1 }));
    await waitFor(() => expect(result.current.cargando).toBe(false));
  });

  test("un 401 cierra la sesion y no muestra un error", async () => {
    adminService.listarPedidos.mockRejectedValue({ response: { status: 401 } });
    const { result } = montar();

    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  test("otro error se muestra y se puede reintentar", async () => {
    adminService.listarPedidos
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce(listado([pedido(1)]));
    const { result } = montar();

    await waitFor(() => expect(result.current.error).toBe("No se pudieron cargar los envíos."));

    act(() => result.current.reintentar());
    await waitFor(() => expect(result.current.listado?.pedidos).toHaveLength(1));
    expect(result.current.error).toBeNull();
  });
});

describe("detalle", () => {
  async function montarConListado() {
    adminService.listarPedidos.mockResolvedValue(listado([pedido(12), pedido(13)]));
    const hook = montar();
    await waitFor(() => expect(hook.result.current.cargando).toBe(false));
    return hook;
  }

  test("abrir un pedido carga su detalle y volver a tocarlo lo cierra", async () => {
    adminService.obtenerPedido.mockResolvedValue(detalle(12));
    const { result } = await montarConListado();

    act(() => result.current.alternarDetalle(12));
    await waitFor(() => expect(result.current.detalle).toEqual(detalle(12)));

    act(() => result.current.alternarDetalle(12));
    expect(result.current.idAbierto).toBeNull();
    expect(result.current.detalle).toBeNull();
  });

  test("un 401 al abrir el detalle cierra la sesion", async () => {
    adminService.obtenerPedido.mockRejectedValue({ response: { status: 401 } });
    const { result } = await montarConListado();

    act(() => result.current.alternarDetalle(12));
    await waitFor(() => expect(result.current.cargandoDetalle).toBe(false));

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(result.current.errorDetalle).toBeNull();
  });

  test("un error del detalle se muestra y se puede reintentar", async () => {
    adminService.obtenerPedido
      .mockRejectedValueOnce({ response: { status: 404, data: { mensaje: "pedido no encontrado" } } })
      .mockResolvedValueOnce(detalle(12));
    const { result } = await montarConListado();

    act(() => result.current.alternarDetalle(12));
    await waitFor(() => expect(result.current.errorDetalle).toBe("pedido no encontrado"));

    act(() => result.current.reintentarDetalle());
    await waitFor(() => expect(result.current.detalle).toEqual(detalle(12)));
  });
});

describe("guardarEnvio", () => {
  async function montarConDetalleAbierto() {
    adminService.listarPedidos.mockResolvedValue(listado([pedido(12)]));
    adminService.obtenerPedido.mockResolvedValue(detalle(12));
    const hook = montar();
    await waitFor(() => expect(hook.result.current.cargando).toBe(false));
    act(() => hook.result.current.alternarDetalle(12));
    await waitFor(() => expect(hook.result.current.detalle).not.toBeNull());
    return hook;
  }

  test("guarda, avisa, cierra el detalle y recarga el listado", async () => {
    adminService.actualizarEnvio.mockResolvedValue({ id: 12, estadoEnvio: "enviado" });
    const { result } = await montarConDetalleAbierto();
    adminService.listarPedidos.mockClear();

    let ok;
    await act(async () => {
      ok = await result.current.guardarEnvio(12, { estadoEnvio: "enviado", nroSeguimiento: "UY1" }, "Pedido #12: enviado.");
    });

    expect(ok).toBe(true);
    expect(adminService.actualizarEnvio).toHaveBeenCalledWith(12, { estadoEnvio: "enviado", nroSeguimiento: "UY1" });
    expect(result.current.aviso).toBe("Pedido #12: enviado.");
    expect(result.current.idAbierto).toBeNull();
    await waitFor(() => expect(adminService.listarPedidos).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.cargando).toBe(false));
  });

  test("un 401 cierra la sesion y no muestra un error", async () => {
    adminService.actualizarEnvio.mockRejectedValue({ response: { status: 401 } });
    const { result } = await montarConDetalleAbierto();

    let ok;
    await act(async () => {
      ok = await result.current.guardarEnvio(12, { estadoEnvio: "enviado" }, "x");
    });

    expect(ok).toBe(false);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(result.current.errorGuardar).toBeNull();
    expect(result.current.aviso).toBeNull();
  });

  test("un 409 muestra el mensaje del backend y deja el detalle abierto", async () => {
    adminService.actualizarEnvio.mockRejectedValue({ response: { status: 409, data: { mensaje: "el pedido cambio mientras lo editabas" } } });
    const { result } = await montarConDetalleAbierto();

    let ok;
    await act(async () => {
      ok = await result.current.guardarEnvio(12, { estadoEnvio: "enviado" }, "x");
    });

    expect(ok).toBe(false);
    expect(result.current.errorGuardar).toBe("el pedido cambio mientras lo editabas");
    expect(result.current.idAbierto).toBe(12);
    expect(result.current.guardando).toBe(false);
  });

  test("un error de red muestra un mensaje generico", async () => {
    adminService.actualizarEnvio.mockRejectedValue(new Error("Network Error"));
    const { result } = await montarConDetalleAbierto();

    await act(async () => {
      await result.current.guardarEnvio(12, { estadoEnvio: "enviado" }, "x");
    });

    expect(result.current.errorGuardar).toBe("No se pudo actualizar el envío.");
  });

  test("cambiar el filtro borra el aviso", async () => {
    adminService.actualizarEnvio.mockResolvedValue({});
    const { result } = await montarConDetalleAbierto();
    await act(async () => {
      await result.current.guardarEnvio(12, { estadoEnvio: "enviado" }, "Pedido #12: enviado.");
    });
    expect(result.current.aviso).not.toBeNull();

    act(() => result.current.cambiarFiltro("enviado"));

    expect(result.current.aviso).toBeNull();
    await waitFor(() => expect(result.current.cargando).toBe(false));
  });
});
