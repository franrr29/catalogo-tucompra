import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import Reportes from "./Reportes";
import { formatearMonto, formatearPorcentaje } from "./formato";
import * as adminService from "../../services/admin.service";

// react-router-dom v7 no se puede resolver desde Jest 27: se simula lo que usa la pagina
jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  }),
  { virtual: true }
);

jest.mock("../../services/admin.service");

const MARGEN = {
  periodo: "mes",
  ingresosTotales: 1000,
  ingresosConCosto: 800,
  ingresosSinCosto: 200,
  costo: 500,
  ganancia: 300,
  margenPct: 37.5,
  coberturaPct: 80,
  productosSinCosto: [],
};

const MAS_VENDIDOS = {
  periodo: "mes",
  orden: "unidades",
  productos: [
    { productoId: 3, nombre: "Reloj A", activo: true, unidades: 12, ingresos: 2400 },
    { productoId: 8, nombre: "Reloj B", activo: false, unidades: 1, ingresos: 150 },
  ],
};

const DEPARTAMENTOS = {
  periodo: "mes",
  departamentos: [
    { departamento: "Montevideo", pedidos: 7, ingresos: 9800 },
    { departamento: "Rivera", pedidos: 1, ingresos: 450 },
  ],
};

let onUnauthorized;

beforeEach(() => {
  onUnauthorized = jest.fn();
  adminService.obtenerMargen.mockReset().mockResolvedValue(MARGEN);
  adminService.obtenerMasVendidos.mockReset().mockResolvedValue(MAS_VENDIDOS);
  adminService.obtenerVentasPorDepartamento.mockReset().mockResolvedValue(DEPARTAMENTOS);
});

async function montar() {
  render(<Reportes onUnauthorized={onUnauthorized} />);
  await screen.findByText("Reloj A");
}

describe("tarjetas de ingresos, ganancia y margen", () => {
  test("muestran los tres datos del periodo", async () => {
    await montar();

    const tarjetas = screen.getByRole("region", { name: "Ingresos y ganancia" });
    expect(within(tarjetas).getByText(formatearMonto(1000))).toBeInTheDocument();
    expect(within(tarjetas).getByText(formatearMonto(300))).toBeInTheDocument();
    expect(within(tarjetas).getByText(formatearPorcentaje(37.5))).toBeInTheDocument();
  });

  test("avisa que parte de los ingresos no tiene costo y no entra en el margen", async () => {
    await montar();

    expect(screen.getByText(/de ingresos no tienen costo/)).toHaveTextContent(formatearMonto(200));
  });

  test("sin ventas con costo, ganancia y margen son 'Sin dato' (no 0)", async () => {
    adminService.obtenerMargen.mockResolvedValue({
      ...MARGEN,
      ingresosConCosto: 0,
      ingresosSinCosto: 1000,
      costo: 0,
      ganancia: 0,
      margenPct: null,
      coberturaPct: 0,
    });
    await montar();

    expect(screen.getAllByText("Sin dato")).toHaveLength(2);
  });

  test("sin ventas en el periodo muestra un estado vacio en vez de ceros", async () => {
    adminService.obtenerMargen.mockResolvedValue({
      ...MARGEN,
      ingresosTotales: 0,
      ingresosConCosto: 0,
      ingresosSinCosto: 0,
      ganancia: 0,
      margenPct: null,
      coberturaPct: null,
    });
    await montar();

    expect(screen.getByText("No hay ventas pagadas en este período.")).toBeInTheDocument();
  });

  test("aclara lo que el margen no incluye y como se cuenta el periodo", async () => {
    await montar();

    expect(screen.getByText(/no incluye la comisión de Mercado Pago ni el costo de envío/)).toBeInTheDocument();
    expect(screen.getByText(/fecha en que se creó el pedido/)).toBeInTheDocument();
  });
});

describe("aviso de productos sin costo", () => {
  test("no aparece si todos tienen costo", async () => {
    await montar();

    expect(screen.queryByText(/^\d+ productos? sin costo cargado$/)).not.toBeInTheDocument();
  });

  test("cuenta los productos y enlaza al editor de cada uno", async () => {
    adminService.obtenerMargen.mockResolvedValue({
      ...MARGEN,
      productosSinCosto: [{ id: 4, nombre: "Reloj sin costo" }, { id: 9, nombre: "Correa" }],
    });
    await montar();

    expect(screen.getByText("2 productos sin costo cargado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Reloj sin costo/ })).toHaveAttribute("href", "/admin/productos?editar=4");
    expect(screen.getByRole("link", { name: /Correa/ })).toHaveAttribute("href", "/admin/productos?editar=9");
  });

  test("en singular", async () => {
    adminService.obtenerMargen.mockResolvedValue({ ...MARGEN, productosSinCosto: [{ id: 4, nombre: "Solo uno" }] });
    await montar();

    expect(screen.getByText("1 producto sin costo cargado")).toBeInTheDocument();
  });

  test("con muchos productos nombra cinco y resume el resto con un enlace a Productos", async () => {
    const muchos = Array.from({ length: 7 }, (_, i) => ({ id: i + 1, nombre: `Producto ${i + 1}` }));
    adminService.obtenerMargen.mockResolvedValue({ ...MARGEN, productosSinCosto: muchos });
    await montar();

    expect(screen.getByText("7 productos sin costo cargado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Producto 5/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Producto 6/ })).not.toBeInTheDocument();
    expect(screen.getByText(/y 2 productos más/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver Productos" })).toHaveAttribute("href", "/admin/productos");
  });

  test("se muestra aunque no haya ventas en el periodo", async () => {
    adminService.obtenerMargen.mockResolvedValue({
      ...MARGEN,
      ingresosTotales: 0,
      ingresosConCosto: 0,
      ingresosSinCosto: 0,
      productosSinCosto: [{ id: 4, nombre: "Sin costo" }],
    });
    await montar();

    expect(screen.getByText("1 producto sin costo cargado")).toBeInTheDocument();
  });
});

describe("ranking de mas vendidos", () => {
  test("lista los productos en orden con unidades e ingresos y marca los dados de baja", async () => {
    await montar();

    const lista = screen.getAllByRole("listitem").filter((li) => li.textContent.includes("Reloj"));
    expect(lista[0]).toHaveTextContent("Reloj A");
    expect(lista[0]).toHaveTextContent("12 unidades");
    expect(lista[0]).toHaveTextContent(formatearMonto(2400));
    expect(lista[1]).toHaveTextContent("1 unidad");
    expect(lista[1]).not.toHaveTextContent("1 unidades");
    expect(lista[1]).toHaveTextContent("Dado de baja");
  });

  test("sin ventas muestra un estado vacio", async () => {
    adminService.obtenerMasVendidos.mockResolvedValue({ ...MAS_VENDIDOS, productos: [] });
    render(<Reportes onUnauthorized={onUnauthorized} />);

    expect(await screen.findByText("No hubo ventas pagadas en este período.")).toBeInTheDocument();
  });

  test("cambiar el orden pide el ranking por ingresos y marca el boton activo", async () => {
    await montar();

    const ingresos = screen.getByRole("button", { name: "Ingresos" });
    expect(screen.getByRole("button", { name: "Unidades" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(ingresos);

    await waitFor(() =>
      expect(adminService.obtenerMasVendidos).toHaveBeenLastCalledWith({ periodo: "mes", orden: "ingresos" })
    );
    expect(ingresos).toHaveAttribute("aria-pressed", "true");
  });
});

describe("ventas por departamento", () => {
  test("muestra ingresos y pedidos por departamento como texto, con barras decorativas", async () => {
    await montar();

    const lista = screen.getByRole("list", { name: "Ingresos por departamento" });
    const filas = within(lista).getAllByRole("listitem");
    expect(filas[0]).toHaveTextContent("Montevideo");
    expect(filas[0]).toHaveTextContent(`${formatearMonto(9800)} · 7 pedidos`);
    expect(filas[1]).toHaveTextContent("Rivera");
    expect(filas[1]).toHaveTextContent(`${formatearMonto(450)} · 1 pedido`);
    expect(filas[1]).not.toHaveTextContent("1 pedidos");
    expect(lista.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });

  test("sin ventas con envio muestra un estado vacio", async () => {
    adminService.obtenerVentasPorDepartamento.mockResolvedValue({ periodo: "mes", departamentos: [] });
    await montar();

    expect(screen.getByText("No hay ventas con envío en este período.")).toBeInTheDocument();
  });
});

describe("periodo", () => {
  test("empieza en este mes y cambiarlo vuelve a pedir los tres reportes", async () => {
    await montar();

    expect(screen.getByRole("button", { name: "Este mes" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Últimos 30 días" }));

    await waitFor(() => expect(adminService.obtenerMargen).toHaveBeenLastCalledWith({ periodo: "30dias" }));
    expect(adminService.obtenerMasVendidos).toHaveBeenLastCalledWith({ periodo: "30dias", orden: "unidades" });
    expect(adminService.obtenerVentasPorDepartamento).toHaveBeenLastCalledWith({ periodo: "30dias" });
    expect(screen.getByRole("button", { name: "Últimos 30 días" })).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByText("Mostrando: Últimos 30 días")).toBeInTheDocument();
  });
});

describe("carga, error y sesion", () => {
  test("mientras carga muestra un estado de carga por seccion", () => {
    adminService.obtenerMargen.mockReturnValue(new Promise(() => {}));
    adminService.obtenerMasVendidos.mockReturnValue(new Promise(() => {}));
    adminService.obtenerVentasPorDepartamento.mockReturnValue(new Promise(() => {}));

    render(<Reportes onUnauthorized={onUnauthorized} />);

    expect(screen.getByText("Cargando rentabilidad...")).toBeInTheDocument();
    expect(screen.getByText("Cargando más vendidos...")).toBeInTheDocument();
    expect(screen.getByText("Cargando ventas por departamento...")).toBeInTheDocument();
    screen.getAllByRole("status").forEach((estado) => expect(estado).toBeInTheDocument());
  });

  test("un error en una seccion se anuncia con boton de reintento y no rompe las otras", async () => {
    adminService.obtenerVentasPorDepartamento.mockRejectedValueOnce({ response: { status: 500 } });
    render(<Reportes onUnauthorized={onUnauthorized} />);

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("No se pudieron cargar las ventas por departamento.");
    expect(await screen.findByText("Reloj A")).toBeInTheDocument();

    fireEvent.click(within(alerta).getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Montevideo")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  test("un 401 cierra la sesion una vez y no muestra errores", async () => {
    const sinSesion = { response: { status: 401 } };
    adminService.obtenerMargen.mockRejectedValue(sinSesion);
    adminService.obtenerMasVendidos.mockRejectedValue(sinSesion);
    adminService.obtenerVentasPorDepartamento.mockRejectedValue(sinSesion);

    render(<Reportes onUnauthorized={onUnauthorized} />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
