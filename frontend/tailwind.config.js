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
      },
    },
  },
  plugins: [],
}

