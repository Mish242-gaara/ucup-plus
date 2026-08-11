import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf1f1",
          100: "#fbe2e3",
          200: "#f5b9bb",
          300: "#ea8a8d",
          400: "#e0585c",
          500: "#d51f2a", // primary red
          600: "#b91723",
          700: "#94121d",
          800: "#6f0e16",
          900: "#4a0a0f",
        },
        live: "#16a34a", // green live indicator
        ink: "#111111", // primary text
      },
      backgroundImage: {
        "diagonal-split":
          "linear-gradient(115deg, #d51f2a 0%, #d51f2a 38%, #f5f5f5 38.5%, #f5f5f5 100%)",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
