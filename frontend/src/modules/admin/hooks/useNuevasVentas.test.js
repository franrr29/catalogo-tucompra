import { renderHook, act } from "@testing-library/react";
import { useNuevasVentas, INTERVALO_MS, BACKOFF_MAXIMO_MS, CLAVE_ULTIMO_VISTO } from "./useNuevasVentas";
import { useAdminSession } from "./useAdminSession";
import * as adminService from "../../../services/admin.service";

jest.mock("../../../services/admin.service");

const mockCerrarSesion = jest.fn();
jest.mock("../AuthContext", () => ({
  useAuth: () => ({ cerrarSesion: mockCerrarSesion }),
}));

const respuesta = (extra = {}) => ({ cantidad: 0, ultimos: [], ultimoId: 0, porDespachar: 0, ...extra });
const venta = (id) => ({ id, fecha: "2026-11-13T09:00:00.000Z", nombre: `Cliente ${id}`, total: 100, ciudad: "Salto" });

let onUnauthorized;

function ponerVisibilidad(estado) {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => estado });
}
function cambiarVisibilidad(estado) {
  ponerVisibilidad(estado);
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  jest.useFakeTimers();
  window.localStorage.clear();
  ponerVisibilidad("visible");
  onUnauthorized = jest.fn();
  mockCerrarSesion.mockReset();
  adminService.pedidosNuevos.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

// deja correr los timers y las promesas pendientes
const avanzar = (ms) => act(async () => { jest.advanceTimersByTime(ms); });
const vaciar = () => act(async () => {});

const montar = () => renderHook(() => useNuevasVentas(onUnauthorized));

describe("primera consulta", () => {
  test("sin nada visto consulta sin desde y fija el punto de partida con ultimoId, sin avisar de pedidos viejos", async () => {
    adminService.pedidosNuevos.mockResolvedValue(respuesta({ ultimoId: 15, porDespachar: 4 }));
    const { result } = montar();
    await vaciar();

    expect(adminService.pedidosNuevos).toHaveBeenCalledWith({}, expect.any(AbortSignal));
    expect(result.current.cantidad).toBe(0);
    expect(result.current.porDespachar).toBe(4);
    expect(window.localStorage.getItem(CLAVE_ULTIMO_VISTO)).toBe("15");
  });

  test("con un id visto guardado consulta con ese desde y muestra lo nuevo", async () => {
    window.localStorage.setItem(CLAVE_ULTIMO_VISTO, "10");
    adminService.pedidosNuevos.mockResolvedValue(respuesta({ cantidad: 2, ultimos: [venta(12), venta(11)], ultimoId: 12, porDespachar: 5 }));
    const { result } = montar();
    await vaciar();

    expect(adminService.pedidosNuevos).toHaveBeenCalledWith({ desde: 10 }, expect.any(AbortSignal));
    expect(result.current.cantidad).toBe(2);
    expect(result.current.ultimos).toHaveLength(2);
    expect(result.current.porDespachar).toBe(5);
    // lo nuevo no se da por visto hasta que el admin lo marque
    expect(window.localStorage.getItem(CLAVE_ULTIMO_VISTO)).toBe("10");
  });

  test("un valor guardado que no es un numero valido se ignora", async () => {
    window.localStorage.setItem(CLAVE_ULTIMO_VISTO, "basura");
    adminService.pedidosNuevos.mockResolvedValue(respuesta({ ultimoId: 3 }));
    montar();
    await vaciar();

    expect(adminService.pedidosNuevos).toHaveBeenCalledWith({}, expect.any(AbortSignal));
  });

  test("si localStorage falla (modo privado) sigue funcionando", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("bloqueado"); });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("bloqueado"); });
    adminService.pedidosNuevos.mockResolvedValue(respuesta({ ultimoId: 15, porDespachar: 2 }));

    const { result } = montar();
    await vaciar();

    expect(result.current.porDespachar).toBe(2);
    expect(result.current.cantidad).toBe(0);
  });
});

describe("ritmo de las consultas", () => {
  test("repite cada 45 segundos y no antes", async () => {
    adminService.pedidosNuevos.mockResolvedValue(respuesta({ ultimoId: 1 }));
    montar();
    await vaciar();
    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(1);

    await avanzar(INTERVALO_MS - 1000);
    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(1);

    await avanzar(1000);
    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(2);

    await avanzar(INTERVALO_MS);
    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(3);
  });

  test("con la pestaña oculta no consulta", async () => {
    ponerVisibilidad("hidden");
    adminService.pedidosNuevos.mockResolvedValue(respuesta());
    montar();
    await vaciar();

    await avanzar(INTERVALO_MS * 5);

    expect(adminService.pedidosNuevos).not.toHaveBeenCalled();
  });

  test("al ocultar la pestaña deja de consultar y al volver consulta enseguida", async () => {
    adminService.pedidosNuevos.mockResolvedValue(respuesta({ ultimoId: 1 }));
    montar();
    await vaciar();
    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(1);

    await act(async () => cambiarVisibilidad("hidden"));
    await avanzar(INTERVALO_MS * 3);
    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(1);

    await act(async () => cambiarVisibilidad("visible"));
    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(2);
  });

  test("no solapa: si hay una consulta en camino, volver a la pestaña no lanza otra", async () => {
    adminService.pedidosNuevos.mockReturnValue(new Promise(() => {}));
    montar();
    await vaciar();

    await act(async () => cambiarVisibilidad("visible"));
    await avanzar(INTERVALO_MS * 2);

    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(1);
  });

  test("ocultar la pestaña cancela la consulta en camino sin mostrar un error ni reintentar de inmediato", async () => {
    let senal;
    adminService.pedidosNuevos.mockImplementation((_, signal) => {
      senal = signal;
      return new Promise((_, rechazar) => {
        signal.addEventListener("abort", () => rechazar(Object.assign(new Error("cancelada"), { code: "ERR_CANCELED" })));
      });
    });
    const { result } = montar();
    await vaciar();

    await act(async () => cambiarVisibilidad("hidden"));

    expect(senal.aborted).toBe(true);
    expect(result.current.cantidad).toBe(0);
    await avanzar(INTERVALO_MS * 3);
    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(1);
  });

  test("al desmontar cancela la consulta y no sigue consultando", async () => {
    let senal;
    adminService.pedidosNuevos.mockImplementation((_, signal) => {
      senal = signal;
      return new Promise(() => {});
    });
    const { unmount } = montar();
    await vaciar();

    unmount();
    await avanzar(INTERVALO_MS * 3);

    expect(senal.aborted).toBe(true);
    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(1);
  });
});

describe("errores", () => {
  test("ante errores espera cada vez mas (90 s, 180 s, tope de 5 min) y vuelve a 45 s al primer exito", async () => {
    adminService.pedidosNuevos.mockRejectedValue(new Error("Network Error"));
    montar();
    await vaciar();
    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(1);

    await avanzar(INTERVALO_MS * 2 - 1000);
    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(1);
    await avanzar(1000);
    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(2);

    await avanzar(INTERVALO_MS * 4);
    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(3);

    // tercer fallo: 45 s * 8 = 360 s, pero el tope es 300 s
    await avanzar(BACKOFF_MAXIMO_MS - 1000);
    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(3);
    adminService.pedidosNuevos.mockResolvedValue(respuesta({ ultimoId: 1 }));
    await avanzar(1000);
    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(4);

    // con el exito vuelve al ritmo normal
    await avanzar(INTERVALO_MS);
    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(5);
  });

  test("un 401 cierra la sesion una sola vez y corta las consultas", async () => {
    adminService.pedidosNuevos.mockRejectedValue({ response: { status: 401 } });
    montar();
    await vaciar();

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    await avanzar(INTERVALO_MS * 10);
    await act(async () => cambiarVisibilidad("visible"));

    expect(adminService.pedidosNuevos).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});

describe("marcar como vistas", () => {
  test("guarda el ultimo id conocido, limpia la campanita y la proxima consulta pide solo lo posterior", async () => {
    window.localStorage.setItem(CLAVE_ULTIMO_VISTO, "10");
    adminService.pedidosNuevos.mockResolvedValue(respuesta({ cantidad: 2, ultimos: [venta(12), venta(11)], ultimoId: 12 }));
    const { result } = montar();
    await vaciar();
    expect(result.current.cantidad).toBe(2);

    act(() => result.current.marcarComoVistas());

    expect(result.current.cantidad).toBe(0);
    expect(result.current.ultimos).toEqual([]);
    expect(window.localStorage.getItem(CLAVE_ULTIMO_VISTO)).toBe("12");

    adminService.pedidosNuevos.mockResolvedValue(respuesta({ ultimoId: 12 }));
    await avanzar(INTERVALO_MS);
    expect(adminService.pedidosNuevos).toHaveBeenLastCalledWith({ desde: 12 }, expect.any(AbortSignal));
  });

  test("una respuesta que estaba en camino cuando se marco como vistas se descarta", async () => {
    window.localStorage.setItem(CLAVE_ULTIMO_VISTO, "10");
    adminService.pedidosNuevos.mockResolvedValueOnce(respuesta({ cantidad: 1, ultimos: [venta(11)], ultimoId: 11 }));
    const { result } = montar();
    await vaciar();

    let resolver;
    adminService.pedidosNuevos.mockReturnValueOnce(new Promise((r) => { resolver = r; }));
    await avanzar(INTERVALO_MS);

    act(() => result.current.marcarComoVistas());
    await act(async () => {
      resolver(respuesta({ cantidad: 1, ultimos: [venta(11)], ultimoId: 11, porDespachar: 7 }));
    });

    expect(result.current.cantidad).toBe(0);
    expect(result.current.ultimos).toEqual([]);
    // el conteo de por despachar si es actual y se actualiza
    expect(result.current.porDespachar).toBe(7);
  });
});

describe("el polling no anula el cierre por inactividad", () => {
  test("con consultas cada 45 s, a los 15 minutos sin actividad real igual cierra la sesion", async () => {
    adminService.pedidosNuevos.mockResolvedValue(respuesta({ ultimoId: 1 }));
    const navigate = jest.fn();
    renderHook(() => {
      useNuevasVentas(onUnauthorized);
      return useAdminSession(navigate);
    });
    await vaciar();

    // se avanza de a un intervalo para que cada consulta se resuelva y programe la siguiente
    for (let i = 0; i < 19; i += 1) await avanzar(INTERVALO_MS);
    await avanzar(15 * 60 * 1000 - 1000 - 19 * INTERVALO_MS);
    expect(mockCerrarSesion).not.toHaveBeenCalled();
    // mientras tanto el polling estuvo consultando
    expect(adminService.pedidosNuevos.mock.calls.length).toBeGreaterThan(15);

    await avanzar(1000);
    expect(mockCerrarSesion).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/admin/login");
  });
});
