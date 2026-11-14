import { renderHook, act } from "@testing-library/react";
import { useEdicionProducto } from "./useEdicionProducto";
import * as adminService from "../../../services/admin.service";
import { obtenerProducto } from "../../../services/productos.service";

jest.mock("../../../services/admin.service");
jest.mock("../../../services/productos.service");

// la lista que tenia el Dashboard antes de guardar (datos viejos)
const LISTA_VIEJA = [{ id: 1, nombre: "Viejo", precio: "100.00", stock: 5, descripcion: "desc vieja" }];

// lo que devuelve el servidor despues de guardar (datos nuevos)
const DETALLE_FRESCO = {
  id: 1,
  nombre: "Nuevo",
  precio: "250.00",
  stock: 0,
  descripcion: null,
  imagenes: [{ id: 7, url: "u7", orden: 0 }, { id: 8, url: "u8", orden: 1 }],
};

let onUnauthorized;

beforeEach(() => {
  onUnauthorized = jest.fn();
  adminService.marcarImagenPrincipal.mockReset();
  adminService.borrarImagen.mockReset();
  obtenerProducto.mockReset();
});

function montar() {
  return renderHook(() => useEdicionProducto(onUnauthorized));
}

test("al abrir un producto el formulario sale de la lista y las imagenes del servidor", async () => {
  obtenerProducto.mockResolvedValue(DETALLE_FRESCO);
  const { result } = montar();

  await act(async () => {
    await result.current.abrirPanel(1, LISTA_VIEJA);
  });

  expect(result.current.actualizarDatos.nombre).toBe("Viejo");
  expect(result.current.imagenesEditor).toEqual(DETALLE_FRESCO.imagenes);
  expect(obtenerProducto).toHaveBeenCalledWith(1, { fresco: true });
});

test("despues de guardar, el formulario se rehidrata con los datos frescos y no con la lista vieja", async () => {
  obtenerProducto.mockResolvedValue(DETALLE_FRESCO);
  const { result } = montar();

  await act(async () => {
    await result.current.abrirPanel(1, LISTA_VIEJA, { rehidratarFormulario: true });
  });

  expect(result.current.actualizarDatos).toEqual({
    nombre: "Nuevo",
    precio: "250.00",
    stock: 0,
    imagen: "",
    descripcion: "",
    costo: "",
  });
});

describe("costo en el formulario de edicion", () => {
  const LISTA_CON_COSTO = [
    { id: 1, nombre: "Con costo", precio: "100.00", stock: 5, costo: "60.00" },
    { id: 2, nombre: "Sin costo", precio: "100.00", stock: 5, costo: null },
    { id: 3, nombre: "Costo cero", precio: "100.00", stock: 5, costo: "0.00" },
  ];

  test("al abrir, el costo sale de la lista del panel; sin costo queda vacio y 0 sigue siendo 0", async () => {
    obtenerProducto.mockResolvedValue({ imagenes: [] });
    const { result } = montar();

    await act(async () => {
      await result.current.abrirPanel(1, LISTA_CON_COSTO);
    });
    expect(result.current.actualizarDatos.costo).toBe("60");

    await act(async () => {
      await result.current.abrirPanel(2, LISTA_CON_COSTO);
    });
    expect(result.current.actualizarDatos.costo).toBe("");

    await act(async () => {
      await result.current.abrirPanel(3, LISTA_CON_COSTO);
    });
    expect(result.current.actualizarDatos.costo).toBe("0");
  });

  test("al rehidratar despues de guardar se conserva el costo del formulario (el detalle publico no lo trae)", async () => {
    obtenerProducto.mockResolvedValue(DETALLE_FRESCO);
    const { result } = montar();

    await act(async () => {
      await result.current.abrirPanel(1, LISTA_CON_COSTO);
    });
    act(() => {
      result.current.setActualizarDatos({ ...result.current.actualizarDatos, costo: "55" });
    });
    await act(async () => {
      await result.current.abrirPanel(1, LISTA_CON_COSTO, { rehidratarFormulario: true });
    });

    expect(result.current.actualizarDatos.nombre).toBe("Nuevo");
    expect(result.current.actualizarDatos.costo).toBe("55");
  });

  test("al cerrar el panel el costo del formulario se vacia", async () => {
    obtenerProducto.mockResolvedValue({ imagenes: [] });
    const { result } = montar();

    await act(async () => {
      await result.current.abrirPanel(1, LISTA_CON_COSTO);
    });
    act(() => {
      result.current.cerrarPanel();
    });

    expect(result.current.actualizarDatos.costo).toBe("");
  });
});

test("sin rehidratar, lo que el usuario escribe mientras llega el detalle no se pisa", async () => {
  let resolverDetalle;
  obtenerProducto.mockReturnValue(new Promise((resolver) => { resolverDetalle = resolver; }));
  const { result } = montar();

  let apertura;
  act(() => {
    apertura = result.current.abrirPanel(1, LISTA_VIEJA);
  });
  act(() => {
    result.current.setActualizarDatos({ ...result.current.actualizarDatos, nombre: "Lo que estoy escribiendo" });
  });
  await act(async () => {
    resolverDetalle(DETALLE_FRESCO);
    await apertura;
  });

  expect(result.current.actualizarDatos.nombre).toBe("Lo que estoy escribiendo");
  expect(result.current.imagenesEditor).toEqual(DETALLE_FRESCO.imagenes);
});

test("marcar principal refresca las imagenes y no toca el formulario ni la lista", async () => {
  adminService.marcarImagenPrincipal.mockResolvedValue();
  obtenerProducto.mockResolvedValue(DETALLE_FRESCO);
  const { result } = montar();

  act(() => {
    result.current.setActualizarDatos({ nombre: "Sin guardar", precio: "9", stock: "1", imagen: "", descripcion: "x" });
  });
  let resultado;
  await act(async () => {
    resultado = await result.current.marcarPrincipal(8, 1);
  });

  expect(resultado).toBe(true);
  expect(adminService.marcarImagenPrincipal).toHaveBeenCalledWith(8);
  expect(result.current.imagenesEditor).toEqual(DETALLE_FRESCO.imagenes);
  expect(result.current.actualizarDatos.nombre).toBe("Sin guardar");
});

test("marcar principal: si falla el refresco, refleja localmente lo que hizo el backend", async () => {
  adminService.marcarImagenPrincipal.mockResolvedValue();
  obtenerProducto
    .mockResolvedValueOnce({ ...DETALLE_FRESCO, imagenes: [{ id: 7, orden: 0 }, { id: 8, orden: 1 }] })
    .mockRejectedValueOnce(new Error("Network Error"));
  const { result } = montar();

  await act(async () => {
    await result.current.abrirPanel(1, LISTA_VIEJA);
  });
  await act(async () => {
    await result.current.marcarPrincipal(8, 1);
  });

  expect(result.current.imagenesEditor).toEqual([{ id: 7, orden: 1 }, { id: 8, orden: 0 }]);
});

test("marcar principal con 401 cierra la sesion y devuelve false", async () => {
  adminService.marcarImagenPrincipal.mockRejectedValue({ response: { status: 401 } });
  const { result } = montar();

  let resultado;
  await act(async () => {
    resultado = await result.current.marcarPrincipal(8, 1);
  });

  expect(resultado).toBe(false);
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
});

test("marcar principal con otro error lo lanza para que el Dashboard lo muestre", async () => {
  adminService.marcarImagenPrincipal.mockRejectedValue({ response: { status: 500 } });
  const { result } = montar();

  await act(async () => {
    await expect(result.current.marcarPrincipal(8, 1)).rejects.toEqual({ response: { status: 500 } });
  });
  expect(onUnauthorized).not.toHaveBeenCalled();
});

test("borrar foto recarga las imagenes del servidor y, si falla la recarga, quita solo esa foto", async () => {
  adminService.borrarImagen.mockResolvedValue();
  obtenerProducto
    .mockResolvedValueOnce(DETALLE_FRESCO)
    .mockResolvedValueOnce({ ...DETALLE_FRESCO, imagenes: [{ id: 8, url: "u8", orden: 0 }] })
    .mockRejectedValueOnce(new Error("Network Error"));
  const { result } = montar();

  await act(async () => {
    await result.current.abrirPanel(1, LISTA_VIEJA);
  });
  await act(async () => {
    await result.current.borrarFoto(7, 1);
  });
  expect(result.current.imagenesEditor).toEqual([{ id: 8, url: "u8", orden: 0 }]);

  await act(async () => {
    await result.current.borrarFoto(8, 1);
  });
  expect(result.current.imagenesEditor).toEqual([]);
});
