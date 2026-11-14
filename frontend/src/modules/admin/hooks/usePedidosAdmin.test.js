import { renderHook, act, waitFor } from "@testing-library/react";
import { usePedidosAdmin } from "./usePedidosAdmin";
import * as adminService from "../../../services/admin.service";

jest.mock("../../../services/admin.service");

const listado = (pedidos = [], extra = {}) => ({ pedidos, pagina: 1, limite: 20, total: pedidos.length, totalPaginas: 1, ...extra });
const pedido = (id) => ({ id, fecha: "2026-11-10T15:30:00.000Z", nombre: `Cliente ${id}`, total: 100, estado: "pagado", tipoEntrega: "domicilio" });
const detallePedido = (id) => ({ id, estado: "pagado", cliente: {}, envio: null, items: [] });

// promesa que se resuelve o rechaza a mano, para controlar el orden de las respuestas
function diferida() {
  const d = {};
  d.promesa = new Promise((resolver, rechazar) => {
    d.resolver = resolver;
    d.rechazar = rechazar;
  });
  return d;
}

let onUnauthorized;

beforeEach(() => {
  onUnauthorized = jest.fn();
  adminService.listarPedidos.mockReset();
  adminService.obtenerPedido.mockReset();
});

function montar() {
  return renderHook(() => usePedidosAdmin(onUnauthorized));
}

describe("listado", () => {
  test("al abrir pide los pagados de la primera pagina", async () => {
    adminService.listarPedidos.mockResolvedValue(listado([pedido(1)]));
    const { result } = montar();

    expect(result.current.cargando).toBe(true);
    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(adminService.listarPedidos).toHaveBeenCalledWith({ estado: "pagado", pagina: 1 });
    expect(result.current.estado).toBe("pagado");
    expect(result.current.listado.pedidos).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  test("cambiar el filtro vuelve a la primera pagina y pide con el nuevo estado", async () => {
    adminService.listarPedidos.mockResolvedValue(listado([pedido(1)], { totalPaginas: 3 }));
    const { result } = montar();
    await waitFor(() => expect(result.current.cargando).toBe(false));

    act(() => result.current.cambiarPagina(2));
    await waitFor(() => expect(adminService.listarPedidos).toHaveBeenLastCalledWith({ estado: "pagado", pagina: 2 }));

    act(() => result.current.cambiarEstado("todos"));
    await waitFor(() => expect(adminService.listarPedidos).toHaveBeenLastCalledWith({ estado: "todos", pagina: 1 }));
    expect(result.current.pagina).toBe(1);
    await waitFor(() => expect(result.current.cargando).toBe(false));
  });

  test("un 401 cierra la sesion y no muestra un error", async () => {
    adminService.listarPedidos.mockRejectedValue({ response: { status: 401 } });
    const { result } = montar();

    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  test("otro error se muestra con el mensaje del backend y se puede reintentar", async () => {
    adminService.listarPedidos
      .mockRejectedValueOnce({ response: { status: 400, data: { mensaje: "estado invalido" } } })
      .mockResolvedValueOnce(listado([pedido(1)]));
    const { result } = montar();

    await waitFor(() => expect(result.current.error).toBe("estado invalido"));
    expect(onUnauthorized).not.toHaveBeenCalled();

    act(() => result.current.reintentar());
    await waitFor(() => expect(result.current.listado?.pedidos).toHaveLength(1));
    expect(result.current.error).toBeNull();
  });

  test("un error de red muestra un mensaje generico", async () => {
    adminService.listarPedidos.mockRejectedValue(new Error("Network Error"));
    const { result } = montar();

    await waitFor(() => expect(result.current.error).toBe("No se pudieron cargar los pedidos."));
  });

  test("si llega tarde la respuesta de un filtro anterior, se descarta", async () => {
    const lenta = diferida();
    adminService.listarPedidos
      .mockReturnValueOnce(lenta.promesa) // pagado, tarda
      .mockResolvedValueOnce(listado([pedido(2)])); // todos, llega primero
    const { result } = montar();

    act(() => result.current.cambiarEstado("todos"));
    await waitFor(() => expect(result.current.listado?.pedidos[0].id).toBe(2));

    await act(async () => {
      lenta.resolver(listado([pedido(1)]));
    });

    expect(result.current.listado.pedidos[0].id).toBe(2);
  });

  test("que el Dashboard pase otra funcion de sesion en cada render no dispara nuevos pedidos", async () => {
    adminService.listarPedidos.mockResolvedValue(listado([pedido(1)]));
    const { result, rerender } = renderHook(({ cb }) => usePedidosAdmin(cb), { initialProps: { cb: jest.fn() } });
    await waitFor(() => expect(result.current.cargando).toBe(false));

    rerender({ cb: jest.fn() });
    rerender({ cb: jest.fn() });

    expect(adminService.listarPedidos).toHaveBeenCalledTimes(1);
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
    adminService.obtenerPedido.mockResolvedValue(detallePedido(12));
    const { result } = await montarConListado();

    act(() => result.current.alternarDetalle(12));
    expect(result.current.idAbierto).toBe(12);
    await waitFor(() => expect(result.current.detalle).toEqual(detallePedido(12)));
    expect(adminService.obtenerPedido).toHaveBeenCalledWith(12);

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
      .mockResolvedValueOnce(detallePedido(12));
    const { result } = await montarConListado();

    act(() => result.current.alternarDetalle(12));
    await waitFor(() => expect(result.current.errorDetalle).toBe("pedido no encontrado"));

    act(() => result.current.reintentarDetalle());
    await waitFor(() => expect(result.current.detalle).toEqual(detallePedido(12)));
    expect(result.current.errorDetalle).toBeNull();
  });

  test("si llega tarde el detalle de un pedido que ya se cerro, se descarta", async () => {
    const lento = diferida();
    adminService.obtenerPedido
      .mockReturnValueOnce(lento.promesa) // el 12 tarda
      .mockResolvedValueOnce(detallePedido(13));
    const { result } = await montarConListado();

    act(() => result.current.alternarDetalle(12));
    act(() => result.current.alternarDetalle(13));
    await waitFor(() => expect(result.current.detalle?.id).toBe(13));

    await act(async () => {
      lento.resolver(detallePedido(12));
    });

    expect(result.current.idAbierto).toBe(13);
    expect(result.current.detalle.id).toBe(13);
  });

  test("cambiar el filtro cierra el detalle abierto", async () => {
    adminService.obtenerPedido.mockResolvedValue(detallePedido(12));
    const { result } = await montarConListado();

    act(() => result.current.alternarDetalle(12));
    await waitFor(() => expect(result.current.detalle).not.toBeNull());

    act(() => result.current.cambiarEstado("pendiente"));

    expect(result.current.idAbierto).toBeNull();
    expect(result.current.detalle).toBeNull();
    await waitFor(() => expect(result.current.cargando).toBe(false));
  });
});
