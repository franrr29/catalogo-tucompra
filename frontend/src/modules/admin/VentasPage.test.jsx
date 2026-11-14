import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import VentasPage from "./VentasPage";

const mockManejarSesionExpirada = jest.fn();

jest.mock("react-router-dom", () => ({ useOutletContext: () => ({ manejarSesionExpirada: mockManejarSesionExpirada }) }), {
  virtual: true,
});

let mockPropsVentas;
jest.mock("./Ventas", () => (props) => {
  mockPropsVentas = props;
  return <div data-testid="ventas" />;
});

test("monta Ventas con el titulo y le pasa el manejo del 401 que da el layout", () => {
  render(<VentasPage />);

  expect(screen.getByRole("heading", { name: "Ventas" })).toBeInTheDocument();
  expect(screen.getByTestId("ventas")).toBeInTheDocument();
  expect(mockPropsVentas.onUnauthorized).toBe(mockManejarSesionExpirada);
});
