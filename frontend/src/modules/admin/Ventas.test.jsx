import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import Ventas from "./Ventas";
import * as adminService from "../../services/admin.service";

jest.mock("../../services/admin.service");

const PEDIDO = {
  id: 12,
  fecha: "2026-11-10T15:30:00.000Z",
  nombre: "Juan Perez",
  total: 250.5,
  estado: "pagado",
  tipoEntrega: "domicilio",
};

const LISTADO = { pedidos: [PEDIDO], pagina: 1, limite: 20, total: 1, totalPaginas: 1 };

const DETALLE_DOMICILIO = {
  id: 12,
  fecha: "2026-11-10T15:30:00.000Z",
  estado: "pagado",
  total: 250.5,
  mercadopagoId: "1234567890",
  cliente: { nombre: "Juan Perez", email: "juan@mail.com", telefono: "099123456" },
  envio: {
    tipoEntrega: "domicilio",
    cedula: "12345678",
    departamento: "Montevideo",
    ciudad: "Pocitos",
    direccion: "Calle Falsa 123 apto 4",
    agencia: null,
    comentario: "casa con rejas",
  },
  items: [{ productoId: 1, nombre: "G-Shock", cantidad: 2, precioUnitario: 100.25, subtotal: 200.5 }],
};

let onUnauthorized;

beforeEach(() => {
  onUnauthorized = jest.fn();
  adminService.listarPedidos.mockReset();
  adminService.obtenerPedido.mockReset();
});

async function montar(listado = LISTADO) {
  adminService.listarPedidos.mockResolvedValue(listado);
  render(<Ventas onUnauthorized={onUnauthorized} />);
  if (listado.pedidos.length > 0) await screen.findByText(listado.pedidos[0].nombre);
}

// la fila del pedido 12 (con el detalle abierto el nombre aparece tambien en el cliente, por eso no se busca por texto)
const filaPedido = () => document.querySelector("button[aria-controls=\"detalle-pedido-12\"]");
const abrirFila = () => fireEvent.click(filaPedido());

test("muestra Cargando mientras llega el listado", async () => {
  adminService.listarPedidos.mockReturnValue(new Promise(() => {}));
  render(<Ventas onUnauthorized={onUnauthorized} />);

  expect(screen.getByRole("status")).toHaveTextContent("Cargando pedidos...");
});

test("por defecto filtra por pagados y muestra fecha, cliente, total, estado y tipo de entrega", async () => {
  await montar();

  expect(adminService.listarPedidos).toHaveBeenCalledWith({ estado: "pagado", pagina: 1 });
  expect(screen.getByRole("button", { name: "Pagados" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Todos" })).toHaveAttribute("aria-pressed", "false");

  const fila = filaPedido();
  expect(within(fila).getByText(/\d{1,2}\/\d{1,2}\/\d{2,4}/)).toBeInTheDocument();
  expect(within(fila).getByText(/\$250[.,]5/)).toBeInTheDocument();
  expect(within(fila).getByText("Pagado")).toBeInTheDocument();
  expect(within(fila).getByText("Domicilio")).toBeInTheDocument();
  expect(screen.getByText("1 pedido")).toBeInTheDocument();
});

test("cambiar el filtro vuelve a pedir con ese estado", async () => {
  await montar();

  fireEvent.click(screen.getByRole("button", { name: "Todos" }));

  await waitFor(() => expect(adminService.listarPedidos).toHaveBeenLastCalledWith({ estado: "todos", pagina: 1 }));
  expect(screen.getByRole("button", { name: "Todos" })).toHaveAttribute("aria-pressed", "true");
  await screen.findByText("Juan Perez");
});

test("sin pedidos muestra un mensaje claro", async () => {
  await montar({ pedidos: [], pagina: 1, limite: 20, total: 0, totalPaginas: 0 });

  expect(await screen.findByText(/No hay pedidos con estado "pagado"/)).toBeInTheDocument();
});

describe("detalle desplegable", () => {
  test("al tocar una fila muestra cliente, envio con cedula y comentario, productos y el id de mercado pago", async () => {
    adminService.obtenerPedido.mockResolvedValue(DETALLE_DOMICILIO);
    await montar();

    abrirFila();

    expect(filaPedido()).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByText("1234567890")).toBeInTheDocument();
    expect(adminService.obtenerPedido).toHaveBeenCalledWith(12);

    const envio = screen.getByRole("region", { name: "Envío" });
    expect(within(envio).getByText("Envío a domicilio")).toBeInTheDocument();
    expect(within(envio).getByText("Montevideo")).toBeInTheDocument();
    expect(within(envio).getByText("Pocitos")).toBeInTheDocument();
    expect(within(envio).getByText("Calle Falsa 123 apto 4")).toBeInTheDocument();
    expect(within(envio).getByText("12345678")).toBeInTheDocument();
    expect(within(envio).getByText("casa con rejas")).toBeInTheDocument();

    const cliente = screen.getByRole("region", { name: "Cliente" });
    expect(within(cliente).getByText("juan@mail.com")).toBeInTheDocument();
    expect(within(cliente).getByText("099123456")).toBeInTheDocument();

    const productos = screen.getByRole("region", { name: "Productos" });
    expect(within(productos).getByText(/G-Shock/)).toBeInTheDocument();
  });

  test("volver a tocar la fila cierra el detalle", async () => {
    adminService.obtenerPedido.mockResolvedValue(DETALLE_DOMICILIO);
    await montar();

    abrirFila();
    await screen.findByText("1234567890");
    abrirFila();

    expect(screen.queryByText("1234567890")).not.toBeInTheDocument();
    expect(filaPedido()).toHaveAttribute("aria-expanded", "false");
  });

  test("retiro en agencia: muestra la agencia y no la direccion", async () => {
    adminService.obtenerPedido.mockResolvedValue({
      ...DETALLE_DOMICILIO,
      envio: { ...DETALLE_DOMICILIO.envio, tipoEntrega: "agencia", direccion: null, agencia: "DAC centro", cedula: null, comentario: null },
    });
    await montar();

    abrirFila();

    const envio = await screen.findByRole("region", { name: "Envío" });
    expect(within(envio).getByText("Retiro en agencia")).toBeInTheDocument();
    expect(within(envio).getByText("DAC centro")).toBeInTheDocument();
    expect(within(envio).queryByText("Dirección")).not.toBeInTheDocument();
    expect(within(envio).getByText("No informada")).toBeInTheDocument();
    expect(within(envio).getByText("Sin comentario")).toBeInTheDocument();
  });

  test("un pedido anterior a la funcion de envio lo aclara", async () => {
    adminService.obtenerPedido.mockResolvedValue({ ...DETALLE_DOMICILIO, envio: null, mercadopagoId: null });
    await montar();

    abrirFila();

    expect(await screen.findByText(/anterior a la función de envío/)).toBeInTheDocument();
    expect(screen.getByText("Sin pago registrado")).toBeInTheDocument();
  });

  test("el comentario se muestra como texto, no como HTML", async () => {
    adminService.obtenerPedido.mockResolvedValue({
      ...DETALLE_DOMICILIO,
      envio: { ...DETALLE_DOMICILIO.envio, comentario: "<img src=x onerror=alert(1)>" },
    });
    await montar();

    abrirFila();

    expect(await screen.findByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(document.querySelector("img[src='x']")).toBeNull();
  });

  test("si falla el detalle muestra el error y permite reintentar", async () => {
    adminService.obtenerPedido
      .mockRejectedValueOnce({ response: { status: 404, data: { mensaje: "pedido no encontrado" } } })
      .mockResolvedValueOnce(DETALLE_DOMICILIO);
    await montar();

    abrirFila();
    expect(await screen.findByText("pedido no encontrado")).toBeInTheDocument();

    const panel = document.getElementById("detalle-pedido-12");
    fireEvent.click(within(panel).getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("1234567890")).toBeInTheDocument();
  });

  test("un 401 al abrir el detalle cierra la sesion", async () => {
    adminService.obtenerPedido.mockRejectedValue({ response: { status: 401 } });
    await montar();

    abrirFila();

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText("Cargando detalle...")).not.toBeInTheDocument());
  });
});

describe("errores del listado", () => {
  test("muestra el error y al reintentar carga el listado", async () => {
    adminService.listarPedidos
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce(LISTADO);
    render(<Ventas onUnauthorized={onUnauthorized} />);

    expect(await screen.findByText("No se pudieron cargar los pedidos.")).toBeInTheDocument();
    expect(screen.queryByText("Juan Perez")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Juan Perez")).toBeInTheDocument();
  });

  test("un 401 cierra la sesion y no muestra un error", async () => {
    adminService.listarPedidos.mockRejectedValue({ response: { status: 401 } });
    render(<Ventas onUnauthorized={onUnauthorized} />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("paginacion", () => {
  const VARIAS = { pedidos: [PEDIDO], pagina: 1, limite: 20, total: 45, totalPaginas: 3 };

  test("muestra la pagina actual y avanza con Siguiente", async () => {
    await montar(VARIAS);

    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => expect(adminService.listarPedidos).toHaveBeenLastCalledWith({ estado: "pagado", pagina: 2 }));
    await screen.findByText("Juan Perez");
  });

  test("con una sola pagina no se muestran los botones de paginacion", async () => {
    await montar();

    expect(screen.queryByRole("navigation", { name: "Paginación" })).not.toBeInTheDocument();
  });
});
