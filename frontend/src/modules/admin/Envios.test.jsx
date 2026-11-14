import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import Envios from "./Envios";
import * as adminService from "../../services/admin.service";

jest.mock("../../services/admin.service");

const PEDIDO = {
  id: 12,
  fecha: "2026-11-10T15:30:00.000Z",
  nombre: "Juan Perez",
  total: 250.5,
  estado: "pagado",
  tipoEntrega: "domicilio",
  departamento: "Montevideo",
  ciudad: "Pocitos",
  estadoEnvio: "por_despachar",
  nroSeguimiento: null,
};

const LISTADO = { pedidos: [PEDIDO], pagina: 1, limite: 20, total: 1, totalPaginas: 1 };

const detalleDe = (envio = {}) => ({
  id: 12,
  estado: "pagado",
  cliente: { nombre: "Juan Perez", email: "juan@mail.com", telefono: "099123456" },
  envio: {
    tipoEntrega: "domicilio",
    cedula: "12345678",
    departamento: "Montevideo",
    ciudad: "Pocitos",
    direccion: "Calle Falsa 123 apto 4",
    agencia: null,
    comentario: "casa con rejas",
    estadoEnvio: "por_despachar",
    nroSeguimiento: null,
    enviadoEn: null,
    ...envio,
  },
  items: [],
});

let onUnauthorized;

beforeEach(() => {
  onUnauthorized = jest.fn();
  adminService.listarPedidos.mockReset();
  adminService.obtenerPedido.mockReset();
  adminService.actualizarEnvio.mockReset();
});

async function montar(listado = LISTADO) {
  adminService.listarPedidos.mockResolvedValue(listado);
  render(<Envios onUnauthorized={onUnauthorized} />);
  if (listado.pedidos.length > 0) await screen.findByText(listado.pedidos[0].nombre);
}

const filaPedido = () => document.querySelector('button[aria-controls="detalle-envio-12"]');

async function abrirDetalle(envio) {
  adminService.obtenerPedido.mockResolvedValue(detalleDe(envio));
  fireEvent.click(filaPedido());
  return screen.findByRole("region", { name: "Actualizar envío" });
}

describe("listado", () => {
  test("por defecto filtra por por despachar y muestra receptor, destino, entrega, estado y fecha", async () => {
    await montar();

    expect(adminService.listarPedidos).toHaveBeenCalledWith({ estadoEnvio: "por_despachar", pagina: 1 });
    expect(screen.getByRole("button", { name: "Por despachar" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Enviados" })).toHaveAttribute("aria-pressed", "false");

    const fila = filaPedido();
    expect(within(fila).getByText("Juan Perez")).toBeInTheDocument();
    expect(within(fila).getByText("Montevideo · Pocitos")).toBeInTheDocument();
    expect(within(fila).getByText("Domicilio")).toBeInTheDocument();
    expect(within(fila).getByText("Por despachar")).toBeInTheDocument();
    expect(within(fila).getByText(/\d{1,2}\/\d{1,2}\/\d{2,4}/)).toBeInTheDocument();
    expect(screen.getByText("1 envío")).toBeInTheDocument();
  });

  test("cambiar el filtro vuelve a pedir con ese estado de envio", async () => {
    await montar();

    fireEvent.click(screen.getByRole("button", { name: "Enviados" }));

    await waitFor(() => expect(adminService.listarPedidos).toHaveBeenLastCalledWith({ estadoEnvio: "enviado", pagina: 1 }));
    await screen.findByText("Juan Perez");
  });

  test("sin envios muestra un mensaje claro", async () => {
    await montar({ pedidos: [], pagina: 1, limite: 20, total: 0, totalPaginas: 0 });

    expect(await screen.findByText("No hay envíos por despachar.")).toBeInTheDocument();
  });

  test("muestra Cargando mientras llega el listado", () => {
    adminService.listarPedidos.mockReturnValue(new Promise(() => {}));
    render(<Envios onUnauthorized={onUnauthorized} />);

    expect(screen.getByRole("status")).toHaveTextContent("Cargando envíos...");
  });

  test("si falla muestra el error y al reintentar carga el listado", async () => {
    adminService.listarPedidos.mockRejectedValueOnce(new Error("Network Error")).mockResolvedValueOnce(LISTADO);
    render(<Envios onUnauthorized={onUnauthorized} />);

    expect(await screen.findByText("No se pudieron cargar los envíos.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Juan Perez")).toBeInTheDocument();
  });

  test("un 401 cierra la sesion y no muestra un error", async () => {
    adminService.listarPedidos.mockRejectedValue({ response: { status: 401 } });
    render(<Envios onUnauthorized={onUnauthorized} />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("pagina con Siguiente", async () => {
    await montar({ ...LISTADO, total: 45, totalPaginas: 3 });

    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => expect(adminService.listarPedidos).toHaveBeenLastCalledWith({ estadoEnvio: "por_despachar", pagina: 2 }));
    await screen.findByText("Juan Perez");
  });
});

describe("detalle", () => {
  test("muestra direccion, comentario y telefono, pero no la cedula ni el email", async () => {
    await montar();

    await abrirDetalle();

    const destinatario = screen.getByRole("region", { name: "Destinatario" });
    expect(within(destinatario).getByText("Calle Falsa 123 apto 4")).toBeInTheDocument();
    expect(within(destinatario).getByText("casa con rejas")).toBeInTheDocument();
    expect(within(destinatario).getByText("099123456")).toBeInTheDocument();
    expect(within(destinatario).getByText("Montevideo")).toBeInTheDocument();
    expect(screen.queryByText("12345678")).not.toBeInTheDocument();
    expect(screen.queryByText("juan@mail.com")).not.toBeInTheDocument();
  });

  test("retiro en agencia: muestra la agencia y no la direccion", async () => {
    await montar();

    await abrirDetalle({ tipoEntrega: "agencia", direccion: null, agencia: "DAC centro", comentario: null });

    const destinatario = screen.getByRole("region", { name: "Destinatario" });
    expect(within(destinatario).getByText("Retiro en agencia")).toBeInTheDocument();
    expect(within(destinatario).getByText("DAC centro")).toBeInTheDocument();
    expect(within(destinatario).queryByText("Dirección")).not.toBeInTheDocument();
    expect(within(destinatario).getByText("Sin comentario")).toBeInTheDocument();
  });

  test("el comentario se muestra como texto, no como HTML", async () => {
    await montar();

    await abrirDetalle({ comentario: "<img src=x onerror=alert(1)>" });

    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(document.querySelector("img[src='x']")).toBeNull();
  });

  test("si falla el detalle muestra el error y permite reintentar", async () => {
    adminService.obtenerPedido
      .mockRejectedValueOnce({ response: { status: 404, data: { mensaje: "pedido no encontrado" } } })
      .mockResolvedValueOnce(detalleDe());
    await montar();

    fireEvent.click(filaPedido());
    expect(await screen.findByText("pedido no encontrado")).toBeInTheDocument();
    fireEvent.click(within(document.getElementById("detalle-envio-12")).getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("region", { name: "Actualizar envío" })).toBeInTheDocument();
  });

  test("un 401 al abrir el detalle cierra la sesion", async () => {
    adminService.obtenerPedido.mockRejectedValue({ response: { status: 401 } });
    await montar();

    fireEvent.click(filaPedido());

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText("Cargando detalle...")).not.toBeInTheDocument());
  });
});

describe("acciones", () => {
  test("por despachar: solo se puede avanzar a enviado, y pide confirmacion antes de guardar", async () => {
    await montar();
    const panel = await abrirDetalle();

    expect(within(panel).getByRole("button", { name: "Marcar como enviado" })).toBeInTheDocument();
    expect(within(panel).queryByRole("button", { name: /Volver/ })).not.toBeInTheDocument();
    expect(within(panel).queryByRole("button", { name: "Marcar como entregado" })).not.toBeInTheDocument();

    fireEvent.click(within(panel).getByRole("button", { name: "Marcar como enviado" }));

    expect(within(panel).getByText(/¿Confirmás que el pedido #12 pasa a/)).toBeInTheDocument();
    expect(adminService.actualizarEnvio).not.toHaveBeenCalled();
  });

  test("cancelar la confirmacion no guarda nada", async () => {
    await montar();
    const panel = await abrirDetalle();
    fireEvent.click(within(panel).getByRole("button", { name: "Marcar como enviado" }));

    fireEvent.click(within(panel).getByRole("button", { name: "Cancelar" }));

    expect(adminService.actualizarEnvio).not.toHaveBeenCalled();
    expect(within(panel).getByRole("button", { name: "Marcar como enviado" })).toBeInTheDocument();
  });

  test("confirmar con seguimiento: guarda estado y seguimiento, muestra el aviso y recarga el listado", async () => {
    adminService.actualizarEnvio.mockResolvedValue({ id: 12, estadoEnvio: "enviado" });
    await montar();
    const panel = await abrirDetalle();

    fireEvent.change(within(panel).getByLabelText(/Número de seguimiento/), { target: { value: "  UY123  " } });
    fireEvent.click(within(panel).getByRole("button", { name: "Marcar como enviado" }));
    adminService.listarPedidos.mockClear();
    fireEvent.click(within(panel).getByRole("button", { name: "Confirmar" }));

    await waitFor(() =>
      expect(adminService.actualizarEnvio).toHaveBeenCalledWith(12, { estadoEnvio: "enviado", nroSeguimiento: "UY123" })
    );
    expect(await screen.findByText("Pedido #12: enviado.")).toBeInTheDocument();
    await waitFor(() => expect(adminService.listarPedidos).toHaveBeenCalledTimes(1));
    expect(document.getElementById("detalle-envio-12")).toBeNull();
  });

  test("sin tocar el seguimiento no lo manda", async () => {
    adminService.actualizarEnvio.mockResolvedValue({});
    await montar();
    const panel = await abrirDetalle();

    fireEvent.click(within(panel).getByRole("button", { name: "Marcar como enviado" }));
    fireEvent.click(within(panel).getByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(adminService.actualizarEnvio).toHaveBeenCalledWith(12, { estadoEnvio: "enviado" }));
    await screen.findByText("Pedido #12: enviado.");
  });

  test("enviado: se puede pasar a entregado o volver a por despachar, y corregir el seguimiento sin cambiar el estado", async () => {
    adminService.actualizarEnvio.mockResolvedValue({});
    await montar();
    const panel = await abrirDetalle({ estadoEnvio: "enviado", nroSeguimiento: "MAL", enviadoEn: "2026-11-12T10:00:00.000Z" });

    expect(within(panel).getByRole("button", { name: "Marcar como entregado" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Volver a por despachar" })).toBeInTheDocument();
    expect(within(panel).queryByRole("button", { name: "Guardar solo el seguimiento" })).not.toBeInTheDocument();
    expect(screen.queryByText("Todavía no")).not.toBeInTheDocument();

    fireEvent.change(within(panel).getByLabelText(/Número de seguimiento/), { target: { value: "BIEN" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Guardar solo el seguimiento" }));

    await waitFor(() =>
      expect(adminService.actualizarEnvio).toHaveBeenCalledWith(12, { estadoEnvio: "enviado", nroSeguimiento: "BIEN" })
    );
    expect(await screen.findByText("Pedido #12: seguimiento guardado.")).toBeInTheDocument();
  });

  test("entregado: solo se puede volver un paso, a enviado", async () => {
    await montar();
    const panel = await abrirDetalle({ estadoEnvio: "entregado" });

    expect(within(panel).getByRole("button", { name: "Volver a enviado" })).toBeInTheDocument();
    expect(within(panel).queryByRole("button", { name: /Marcar como/ })).not.toBeInTheDocument();
  });

  test("borrar el seguimiento guardado manda vacio", async () => {
    adminService.actualizarEnvio.mockResolvedValue({});
    await montar();
    const panel = await abrirDetalle({ estadoEnvio: "enviado", nroSeguimiento: "UY1" });

    fireEvent.change(within(panel).getByLabelText(/Número de seguimiento/), { target: { value: "" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Marcar como entregado" }));
    fireEvent.click(within(panel).getByRole("button", { name: "Confirmar" }));

    await waitFor(() =>
      expect(adminService.actualizarEnvio).toHaveBeenCalledWith(12, { estadoEnvio: "entregado", nroSeguimiento: "" })
    );
    await screen.findByText("Pedido #12: entregado.");
  });

  test("el campo de seguimiento no deja pasar de 60 caracteres", async () => {
    await montar();
    const panel = await abrirDetalle();

    expect(within(panel).getByLabelText(/Número de seguimiento/)).toHaveAttribute("maxLength", "60");
  });

  test("si el backend responde 409 muestra el mensaje, deja el detalle abierto y vuelve a ofrecer las acciones", async () => {
    adminService.actualizarEnvio.mockRejectedValue({ response: { status: 409, data: { mensaje: "el pedido cambio mientras lo editabas: recarga y vuelve a intentarlo" } } });
    await montar();
    const panel = await abrirDetalle();

    fireEvent.click(within(panel).getByRole("button", { name: "Marcar como enviado" }));
    fireEvent.click(within(panel).getByRole("button", { name: "Confirmar" }));

    expect(await within(panel).findByRole("alert")).toHaveTextContent(/el pedido cambio mientras lo editabas/);
    expect(within(panel).getByRole("button", { name: "Marcar como enviado" })).toBeEnabled();
    expect(screen.queryByText(/Pedido #12: enviado/)).not.toBeInTheDocument();
  });

  test("un 401 al guardar cierra la sesion", async () => {
    adminService.actualizarEnvio.mockRejectedValue({ response: { status: 401 } });
    await montar();
    const panel = await abrirDetalle();

    fireEvent.click(within(panel).getByRole("button", { name: "Marcar como enviado" }));
    fireEvent.click(within(panel).getByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(within(panel).getByRole("button", { name: "Marcar como enviado" })).toBeEnabled());
  });

  test("mientras guarda, los botones quedan deshabilitados", async () => {
    let terminar;
    adminService.actualizarEnvio.mockReturnValue(new Promise((resolver) => { terminar = resolver; }));
    await montar();
    const panel = await abrirDetalle();

    fireEvent.click(within(panel).getByRole("button", { name: "Marcar como enviado" }));
    fireEvent.click(within(panel).getByRole("button", { name: "Confirmar" }));

    expect(await within(panel).findByRole("button", { name: "Guardando..." })).toBeDisabled();
    expect(within(panel).getByRole("button", { name: "Cancelar" })).toBeDisabled();

    terminar({});
    await screen.findByText("Pedido #12: enviado.");
  });
});
