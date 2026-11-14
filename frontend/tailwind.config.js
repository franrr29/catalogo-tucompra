/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#C89211", dark: "#A3740A" },
        ink: { DEFAULT: "#111111", soft: "#1A1A1A" },
        paper: "#F4F4F2",
        muted: { DEFAULT: "#666666", light: "#777777", lighter: "#999999" },
        border: "#CCCCCC",

        // tokens del panel de administracion: solo se agregan claves nuevas, los colores de arriba son los de la tienda
        // el dorado vivo (acento) no llega a 3:1 sobre fondo claro: se usa en decoracion y sobre fondo oscuro,
        // nunca como color de texto sobre claro. Para texto chico: oro.texto (4.98:1 sobre paper); para texto grande en negrita: oro.titulo
        oro: {
          acento: "#C89211",
          titulo: "#A3740A",
          texto: "#8A6209",
          suave: "#F6ECD2",
        },
        superficie: "#FFFFFF",
        // borde sutil de tarjetas y separadores (decorativo)
        linea: "#E7E4DC",
        // borde de campos y controles: 3.15:1 sobre paper, cumple el 3:1 de componentes de interfaz
        campo: "#8A8A86",
      },
      borderRadius: {
        tarjeta: "1rem",
        control: "0.75rem",
      },
      boxShadow: {
        tarjeta: "0 1px 2px rgb(17 17 17 / 0.04), 0 10px 28px -14px rgb(17 17 17 / 0.14)",
        elevada: "0 16px 44px -10px rgb(17 17 17 / 0.22)",
      },
      keyframes: {
        aparecer: {
          from: { opacity: "0", transform: "translateY(-4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        aparecer: "aparecer 200ms ease-out",
      },
    },
  },
  plugins: [],
}
