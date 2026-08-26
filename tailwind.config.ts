import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#080A0F",
          900: "#0B0E15",
          800: "#111522",
          700: "#171C2C",
          600: "#232A3F",
          500: "#333C57",
        },
        paper: {
          100: "#F3F5FA",
          300: "#C7CCDC",
          500: "#8B93A8",
        },
        signal: {
          amber: "#E8A33D",
          amberDim: "#8A661F",
          teal: "#4FD1B5",
          tealDim: "#245349",
          rose: "#E1667C",
          roseDim: "#5A2A34",
        },
      },
      fontWeight: {
        "600": "600",
        "700": "700",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(232,163,61,0.06), transparent 60%)",
      },
    },
  },
  plugins: [],
};
export default config;
