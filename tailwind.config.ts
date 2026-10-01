import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0E1A2F",
          600: "#1B2C49",
          400: "#3A4E72",
        },
        gold: {
          DEFAULT: "#F2B705",
          light: "#FFF4CC",
          dark: "#C8960A",
        },
      },
      fontFamily: {
        sans: ["Carlito", "Calibri", "Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
