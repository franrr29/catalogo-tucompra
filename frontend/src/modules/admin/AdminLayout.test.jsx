import "@testing-library/jest-dom";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AdminLayout from "./AdminLayout";

// react-router-dom v7 no se puede resolver desde Jest 27: se simula lo que usa el layout
const mockNavigate = jest.fn();
let mockContexto;
let mockRuta = "/admin/productos";

jest.mock(
  "react-router-dom",
  () => ({
    NavLink: ({ to, className, children }) => {
      const activo = mockRuta === to;
      return (
        <a href={to} aria-current={activo ? "page" : undefined} className={className({ isActive: activo })}>
          {children}
        </a>
      );
    },
    Outlet: ({ context }) => {
      mockContexto = context;
      return <div data-testid="pagina" />;
    },
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockRuta }),
  }),
  { virtual: true }
);

const mockCerrarSesion = jest.fn();
jest.mock("./AuthContext", () => ({
  useAuth: () => ({ cerrarSesion: mockCerrarSesion }),
}));

jest.mock("react-hot-toast", () => ({ toast: { error: jest.fn() } }));
const { toast } = require("react-hot-toast");

beforeEach(() => {
  mockNavigate.mockReset();
  mockCerrarSesion.mockReset().mockResolvedValue();
  toast.error.mockReset();
  mockRuta = "/admin/productos";
  mockContexto = undefined;
});

describe("menu lateral", () => {
  test("tiene los links a Productos y Ventas y marca la pagina activa", () => {
    render(<AdminLayout />);

    const menu = screen.getByRole("navigation", { name: "Secciones del panel" });
    const productos = menu.querySelector('a[href="/admin/productos"]');
    const ventas = menu.querySelector('a[href="/admin/ventas"]');
    expect(productos).toHaveTextContent("Productos");
    expect(ventas).toHaveTextContent("Ventas");
    expect(menu.querySelector('a[href="/admin/envios"]')).toHaveTextContent("Envíos");
    expect(productos).toHaveAttribute("aria-current", "page");
    expect(ventas).not.toHaveAttribute("aria-current");
  });

  test("muestra la pagina activa en el contenido", () => {
    render(<AdminLayout />);

    expect(screen.getByTestId("pagina")).toBeInTheDocument();
  });

  test("en movil empieza cerrado y el boton hamburguesa lo abre y lo cierra", () => {
    render(<AdminLayout />);
    const boton = screen.getByRole("button", { name: "Abrir menú" });
    const menu = document.getElementById("menu-admin");

    expect(boton).toHaveAttribute("aria-expanded", "false");
    expect(boton).toHaveAttribute("aria-controls", "menu-admin");
    // cerrado esta oculto salvo en escritorio (md:flex): sus links no entran en el orden del teclado
    expect(menu.className).toMatch(/\bhidden\b/);

    fireEvent.click(boton);
    expect(screen.getByRole("button", { name: "Cerrar menú" })).toHaveAttribute("aria-expanded", "true");
    expect(menu.className).not.toMatch(/\bhidden\b/);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar menú" }));
    expect(menu.className).toMatch(/\bhidden\b/);
  });

  test("Escape cierra el menu y devuelve el foco al boton", () => {
    render(<AdminLayout />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));

    fireEvent.keyDown(window, { key: "Escape" });

    const boton = screen.getByRole("button", { name: "Abrir menú" });
    expect(boton).toHaveAttribute("aria-expanded", "false");
    expect(boton).toHaveFocus();
  });

  test("tocar el fondo oscuro lo cierra", () => {
    render(<AdminLayout />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));

    fireEvent.click(screen.getByTestId("fondo-menu"));

    expect(screen.getByRole("button", { name: "Abrir menú" })).toHaveAttribute("aria-expanded", "false");
  });

  test("cambiar de pagina cierra el menu", () => {
    const { rerender } = render(<AdminLayout />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));

    mockRuta = "/admin/ventas";
    rerender(<AdminLayout />);

    expect(screen.getByRole("button", { name: "Abrir menú" })).toHaveAttribute("aria-expanded", "false");
  });
});

describe("cerrar sesion", () => {
  test("el boton del header cierra la sesion y lleva al login", async () => {
    render(<AdminLayout />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    });

    expect(mockCerrarSesion).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/admin/login");
  });

  test("las paginas reciben manejarSesionExpirada: avisa, cierra la sesion y redirige", async () => {
    render(<AdminLayout />);

    await act(async () => {
      await mockContexto.manejarSesionExpirada();
    });

    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/sesion expiro/));
    expect(mockCerrarSesion).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/admin/login");
  });
});

describe("cierre por inactividad", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const QUINCE_MIN = 15 * 60 * 1000;

  test("a los 15 minutos sin actividad cierra la sesion, en cualquier pagina del panel", async () => {
    mockRuta = "/admin/ventas";
    render(<AdminLayout />);

    await act(async () => {
      jest.advanceTimersByTime(QUINCE_MIN - 1000);
    });
    expect(mockCerrarSesion).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockCerrarSesion).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/admin/login");
  });

  test("la actividad real del usuario reinicia el contador", async () => {
    render(<AdminLayout />);

    await act(async () => {
      jest.advanceTimersByTime(QUINCE_MIN - 1000);
    });
    fireEvent.click(document.body);
    await act(async () => {
      jest.advanceTimersByTime(QUINCE_MIN - 1000);
    });

    expect(mockCerrarSesion).not.toHaveBeenCalled();
  });

  test("navegar entre paginas no reinicia ni duplica el contador (vive en el layout)", async () => {
    const { rerender } = render(<AdminLayout />);

    await act(async () => {
      jest.advanceTimersByTime(QUINCE_MIN - 1000);
    });
    mockRuta = "/admin/ventas";
    rerender(<AdminLayout />);
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockCerrarSesion).toHaveBeenCalledTimes(1);
  });
});
