import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Card, CardTitle } from "./Card";
import PageHeader from "./PageHeader";
import Badge from "./Badge";
import EmptyState from "./EmptyState";
import CargandoEstado from "./CargandoEstado";
import { boton, campo, filtro } from "./estilos";

describe("Card", () => {
  test("renderiza el contenido en una section y acepta otra etiqueta y atributos", () => {
    render(
      <Card as="article" aria-label="Resumen" data-testid="tarjeta">
        contenido
      </Card>
    );

    const tarjeta = screen.getByTestId("tarjeta");
    expect(tarjeta.tagName).toBe("ARTICLE");
    expect(tarjeta).toHaveTextContent("contenido");
    expect(tarjeta.className).toMatch(/rounded-tarjeta/);
    expect(tarjeta.className).toMatch(/shadow-tarjeta/);
  });

  test("CardTitle es un h2 por defecto, con el punto decorativo oculto para lectores de pantalla", () => {
    render(<CardTitle>Nuevo artículo</CardTitle>);

    const titulo = screen.getByRole("heading", { level: 2, name: "Nuevo artículo" });
    expect(titulo.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  test("CardTitle acepta otro nivel de encabezado", () => {
    render(<CardTitle as="h3">Detalle</CardTitle>);

    expect(screen.getByRole("heading", { level: 3, name: "Detalle" })).toBeInTheDocument();
  });
});

describe("PageHeader", () => {
  test("muestra el titulo como h1, la descripcion y los badges de la derecha", () => {
    render(
      <PageHeader titulo="Ventas" descripcion="Pedidos pagados">
        <span>6 pedidos</span>
      </PageHeader>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Ventas" })).toBeInTheDocument();
    expect(screen.getByText("Pedidos pagados")).toBeInTheDocument();
    expect(screen.getByText("6 pedidos")).toBeInTheDocument();
  });

  test("sin descripcion ni acciones solo muestra el titulo", () => {
    render(<PageHeader titulo="Envíos" />);

    expect(screen.getByRole("heading", { level: 1, name: "Envíos" })).toBeInTheDocument();
    expect(document.querySelectorAll("p")).toHaveLength(0);
  });
});

describe("Badge", () => {
  test("muestra su texto en un solo nodo", () => {
    render(<Badge variante="exito">Pagado</Badge>);

    expect(screen.getByText("Pagado")).toBeInTheDocument();
  });

  test.each(["neutro", "oro", "exito", "aviso", "info", "peligro"])("la variante %s tiene fondo y texto definidos", (variante) => {
    render(<Badge variante={variante}>x</Badge>);

    expect(screen.getByText("x").className).toMatch(/bg-/);
    expect(screen.getByText("x").className).toMatch(/text-/);
  });

  test("una variante desconocida cae en la neutra", () => {
    render(<Badge variante="inexistente">x</Badge>);

    expect(screen.getByText("x").className).toMatch(/bg-superficie/);
  });
});

describe("EmptyState", () => {
  test("vacio: muestra el mensaje y las acciones, sin rol", () => {
    render(
      <EmptyState titulo="No hay pedidos">
        <button type="button">Reintentar</button>
      </EmptyState>
    );

    expect(screen.getByText("No hay pedidos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("error con role alert se anuncia y el icono es decorativo", () => {
    render(<EmptyState tono="error" role="alert" titulo="No se pudieron cargar los pedidos." />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron cargar los pedidos.");
    expect(document.querySelector("svg").getAttribute("aria-hidden")).toBe("true");
  });
});

describe("CargandoEstado", () => {
  test("anuncia el texto como status y los esqueletos quedan ocultos a lectores de pantalla", () => {
    render(<CargandoEstado texto="Cargando pedidos..." filas={2} />);

    expect(screen.getByRole("status")).toHaveTextContent("Cargando pedidos...");
    const esqueletos = document.querySelector('[aria-hidden="true"]');
    expect(esqueletos.children).toHaveLength(2);
    expect(esqueletos.firstChild.className).toMatch(/motion-reduce:animate-none/);
  });
});

describe("estilos", () => {
  test("los botones y campos tienen anillo de foco visible y transicion que respeta reduced motion", () => {
    expect(boton.primario).toMatch(/focus-visible:ring-2/);
    expect(boton.secundario).toMatch(/focus-visible:ring-oro-acento/);
    expect(boton.primario).toMatch(/motion-reduce:transition-none/);
    expect(campo).toMatch(/focus:ring-2/);
    expect(campo).toMatch(/border-campo/);
  });

  test("el filtro activo y el inactivo se distinguen sin depender solo del color", () => {
    expect(filtro.activo).toMatch(/bg-ink/);
    expect(filtro.inactivo).toMatch(/bg-superficie/);
  });
});
