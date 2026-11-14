import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "react-hot-toast";
import ProductosPage from "./ProductosPage";
import * as adminService from "../../services/admin.service";
import { obtenerProducto } from "../../services/productos.service";

// react-router-dom v7 no se puede resolver desde Jest 27: se simula lo que usa la pagina
const mockSesionExpirada = jest.fn();
let mockParametros = new URLSearchParams("");

jest.mock(
  "react-router-dom",
  () => ({
    useOutletContext: () => ({ manejarSesionExpirada: mockSesionExpirada }),
    useSearchParams: () => [mockParametros],
  }),
  { virtual: true }
);

jest.mock("react-hot-toast", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock("../../services/admin.service");
jest.mock("../../services/productos.service");

const PRODUCTOS = [
  { id: 1, nombre: "Reloj A", precio: "100.00", stock: 3, costo: "60.00", descripcion: null },
  { id: 2, nombre: "Reloj B", precio: "50.00", stock: 0, costo: null, descripcion: null },
  { id: 3, nombre: "Reloj C", precio: "80.00", stock: 1, costo: "0.00", descripcion: null },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockParametros = new URLSearchParams("");
  adminService.obtenerProductosAdmin.mockResolvedValue(PRODUCTOS);
  adminService.crearProducto.mockResolvedValue({ id: 9 });
  adminService.actualizarProducto.mockResolvedValue({});
  obtenerProducto.mockResolvedValue({ imagenes: [] });
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

async function montar() {
  render(<ProductosPage />);
  await screen.findByRole("table"); // la tarjeta de rentabilidad aparece cuando carga la lista
  await screen.findByText("Reloj A");
}

// abre un producto con el boton de la tarjeta de rentabilidad y espera su formulario
async function abrirProducto(nombreBoton) {
  fireEvent.click(await screen.findByRole("button", { name: nombreBoton }));
  return screen.findByLabelText("Costo");
}

describe("alta de producto con costo", () => {
  function llenarBasicos() {
    fireEvent.change(screen.getByPlaceholderText("Ej: G-Shock Gold"), { target: { value: "Reloj Nuevo" } });
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "100" } });
    fireEvent.change(screen.getByPlaceholderText("Unidades"), { target: { value: "5" } });
  }
  const publicar = () => fireEvent.click(screen.getByRole("button", { name: "Publicar artículo" }));

  test("sin costo no manda el campo: queda desconocido, nunca 0", async () => {
    await montar();
    llenarBasicos();

    publicar();

    await waitFor(() => expect(adminService.crearProducto).toHaveBeenCalledTimes(1));
    expect(adminService.crearProducto.mock.calls[0][0]).not.toHaveProperty("costo");
  });

  test("con costo lo manda como numero, y 0 tambien", async () => {
    await montar();
    llenarBasicos();
    fireEvent.change(screen.getByLabelText("Costo (opcional)"), { target: { value: "60.5" } });
    publicar();
    await waitFor(() => expect(adminService.crearProducto).toHaveBeenCalledTimes(1));
    expect(adminService.crearProducto.mock.calls[0][0].costo).toBe(60.5);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("producto creado"));
    llenarBasicos();
    fireEvent.change(screen.getByLabelText("Costo (opcional)"), { target: { value: "0" } });
    publicar();
    await waitFor(() => expect(adminService.crearProducto).toHaveBeenCalledTimes(2));
    expect(adminService.crearProducto.mock.calls[1][0].costo).toBe(0);
  });

  test("un costo negativo no se envia y avisa", async () => {
    await montar();
    llenarBasicos();
    fireEvent.change(screen.getByLabelText("Costo (opcional)"), { target: { value: "-3" } });

    publicar();

    expect(toast.error).toHaveBeenCalledWith("el costo debe ser un numero mayor o igual a 0");
    expect(adminService.crearProducto).not.toHaveBeenCalled();
  });

  test("si el costo supera al precio muestra una advertencia pero deja publicar", async () => {
    await montar();
    llenarBasicos();
    fireEvent.change(screen.getByLabelText("Costo (opcional)"), { target: { value: "150" } });

    expect(screen.getByText(/El costo es mayor que el precio/)).toBeInTheDocument();
    publicar();

    await waitFor(() => expect(adminService.crearProducto).toHaveBeenCalledTimes(1));
    expect(adminService.crearProducto.mock.calls[0][0].costo).toBe(150);
  });
});

describe("edicion del costo de un producto", () => {
  const confirmar = () => fireEvent.click(screen.getByRole("button", { name: "Confirmar Cambios" }));

  test("el formulario trae el costo actual", async () => {
    await montar();

    const campoCosto = await abrirProducto("Editar costo de Reloj A");

    expect(campoCosto).toHaveValue(60);
  });

  test("cambiar el costo lo manda como numero", async () => {
    await montar();
    const campoCosto = await abrirProducto("Editar costo de Reloj A");

    fireEvent.change(campoCosto, { target: { value: "55.5" } });
    confirmar();

    await waitFor(() => expect(adminService.actualizarProducto).toHaveBeenCalledTimes(1));
    expect(adminService.actualizarProducto.mock.calls[0][0]).toBe(1);
    expect(adminService.actualizarProducto.mock.calls[0][1].costo).toBe(55.5);
  });

  test("vaciar el costo manda null (costo desconocido)", async () => {
    await montar();
    const campoCosto = await abrirProducto("Editar costo de Reloj A");

    fireEvent.change(campoCosto, { target: { value: "" } });
    confirmar();

    await waitFor(() => expect(adminService.actualizarProducto).toHaveBeenCalledTimes(1));
    expect(adminService.actualizarProducto.mock.calls[0][1]).toHaveProperty("costo", null);
  });

  test("un costo 0 se manda como 0, no como null", async () => {
    await montar();
    const campoCosto = await abrirProducto("Editar costo de Reloj A");

    fireEvent.change(campoCosto, { target: { value: "0" } });
    confirmar();

    await waitFor(() => expect(adminService.actualizarProducto).toHaveBeenCalledTimes(1));
    expect(adminService.actualizarProducto.mock.calls[0][1]).toHaveProperty("costo", 0);
  });

  test("si el costo no cambio no se manda (no se pisa por accidente)", async () => {
    await montar();
    await abrirProducto("Editar costo de Reloj A");

    fireEvent.change(screen.getByPlaceholderText("Nombre"), { target: { value: "Reloj A2" } });
    confirmar();

    await waitFor(() => expect(adminService.actualizarProducto).toHaveBeenCalledTimes(1));
    const datos = adminService.actualizarProducto.mock.calls[0][1];
    expect(datos.nombre).toBe("Reloj A2");
    expect(datos).not.toHaveProperty("costo");
  });

  test("un producto sin costo que sigue sin costo tampoco manda el campo", async () => {
    await montar();
    await abrirProducto("Cargar costo de Reloj B");

    confirmar();

    await waitFor(() => expect(adminService.actualizarProducto).toHaveBeenCalledTimes(1));
    expect(adminService.actualizarProducto.mock.calls[0][1]).not.toHaveProperty("costo");
  });

  test("un costo negativo no se envia y avisa", async () => {
    await montar();
    const campoCosto = await abrirProducto("Editar costo de Reloj A");

    fireEvent.change(campoCosto, { target: { value: "-1" } });
    confirmar();

    expect(toast.error).toHaveBeenCalledWith("el costo debe ser un numero mayor o igual a 0");
    expect(adminService.actualizarProducto).not.toHaveBeenCalled();
  });

  test("advierte si el costo supera al precio, sin bloquear el guardado", async () => {
    await montar();
    const campoCosto = await abrirProducto("Editar costo de Reloj A");

    fireEvent.change(campoCosto, { target: { value: "120" } });
    expect(screen.getByText(/El costo es mayor que el precio/)).toBeInTheDocument();
    confirmar();

    await waitFor(() => expect(adminService.actualizarProducto).toHaveBeenCalledTimes(1));
    expect(adminService.actualizarProducto.mock.calls[0][1].costo).toBe(120);
  });
});

describe("enlace ?editar=<id>", () => {
  test("abre el producto indicado en el editor", async () => {
    mockParametros = new URLSearchParams("editar=2");

    render(<ProductosPage />);

    const campoCosto = await screen.findByLabelText("Costo");
    expect(campoCosto).toHaveValue(null);
    expect(screen.getByPlaceholderText("Nombre")).toHaveValue("Reloj B");
  });

  test.each([["abc"], ["0"], ["-1"], ["1.5"], ["1e1"], ["007"], [""], ["999"]])(
    "el valor %p se ignora: el editor no se abre",
    async (valor) => {
      mockParametros = new URLSearchParams({ editar: valor });

      await montar();

      expect(screen.queryByLabelText("Costo")).not.toBeInTheDocument();
      expect(obtenerProducto).not.toHaveBeenCalled();
    }
  );

  test("sin el parametro el editor tampoco se abre", async () => {
    await montar();

    expect(screen.queryByLabelText("Costo")).not.toBeInTheDocument();
  });

  test("se abre una sola vez aunque la pagina se vuelva a renderizar", async () => {
    mockParametros = new URLSearchParams("editar=1");

    const { rerender } = render(<ProductosPage />);
    await screen.findByLabelText("Costo");
    rerender(<ProductosPage />);
    rerender(<ProductosPage />);

    await waitFor(() => expect(obtenerProducto).toHaveBeenCalledTimes(1));
  });
});

describe("tarjeta de rentabilidad", () => {
  test("lista los productos con su margen y avisa los que no tienen costo", async () => {
    await montar();

    expect(screen.getByText("1 sin costo cargado")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Reloj A/ })).toHaveTextContent("$40 · 40%");
  });
});
