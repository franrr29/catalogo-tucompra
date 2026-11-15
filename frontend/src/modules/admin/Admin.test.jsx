import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "react-hot-toast";
import Admin from "./Admin";
import * as adminService from "../../services/admin.service";

// la animacion no aporta nada en estos tests
jest.mock("framer-motion", () => ({
  motion: { div: ({ children, className }) => <div className={className}>{children}</div> },
}));
jest.mock("../../services/admin.service");
jest.mock("react-hot-toast", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
// react-router-dom v7 no se puede resolver desde Jest 27: se simula lo que usa la pagina
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock("./AuthContext", () => ({ useAuth: () => ({ iniciarSesion: jest.fn() }) }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

function ingresarConError(status) {
  adminService.login.mockRejectedValue({ response: status === undefined ? undefined : { status } });
  render(<Admin />);
  fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));
}

test("401: avisa credenciales invalidas", async () => {
  ingresarConError(401);
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith("CREDENCIALES INVÁLIDAS"));
});

test("429: avisa que hubo demasiados intentos, no que el servidor no responde", async () => {
  ingresarConError(429);

  await waitFor(() => expect(toast.error).toHaveBeenCalled());
  expect(toast.error.mock.calls[0][0]).toMatch(/DEMASIADOS INTENTOS/);
});

test.each([[500], [503], [undefined]])("error %p: avisa problema de conexion, no credenciales invalidas", async (status) => {
  ingresarConError(status);

  await waitFor(() => expect(toast.error).toHaveBeenCalled());
  expect(toast.error.mock.calls[0][0]).toMatch(/NO SE PUDO CONECTAR/);
  expect(toast.error).not.toHaveBeenCalledWith("CREDENCIALES INVÁLIDAS");
});
