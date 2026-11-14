import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import * as adminService from "../../services/admin.service";

jest.mock("../../services/admin.service");

// muestra en pantalla lo que expone el contexto
function Estado() {
  const { isLogIn, loading, sesionIndeterminada } = useAuth();
  if (loading) return <p>cargando</p>;
  return <p>{`isLogIn=${isLogIn} indeterminada=${sesionIndeterminada}`}</p>;
}

function montar() {
  render(
    <AuthProvider>
      <Estado />
    </AuthProvider>
  );
}

test("sesion valida: isLogIn queda en true", async () => {
  adminService.verificarSesion.mockResolvedValue();
  montar();
  expect(await screen.findByText("isLogIn=true indeterminada=false")).toBeInTheDocument();
});

test("un 401 real: isLogIn false y la sesion no es indeterminada", async () => {
  adminService.verificarSesion.mockRejectedValue({ response: { status: 401 } });
  montar();
  expect(await screen.findByText("isLogIn=false indeterminada=false")).toBeInTheDocument();
});

test("error de red: no se da por cerrada la sesion, queda indeterminada", async () => {
  adminService.verificarSesion.mockRejectedValue(new Error("Network Error"));
  montar();
  expect(await screen.findByText("isLogIn=false indeterminada=true")).toBeInTheDocument();
});

test("un 503 (servidor arrancando): queda indeterminada, no es un 401", async () => {
  adminService.verificarSesion.mockRejectedValue({ response: { status: 503 } });
  montar();
  expect(await screen.findByText("isLogIn=false indeterminada=true")).toBeInTheDocument();
});
