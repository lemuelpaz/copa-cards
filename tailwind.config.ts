import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        green: { neon: "#00e676", dark: "#00b248", dim: "rgba(0,230,118,0.12)", glow: "rgba(0,230,118,0.35)" },
        bg:    { DEFAULT: "#060c06", 2: "#0b130b", 3: "#111a11", 4: "#161f16" },
        gold:  { DEFAULT: "#ffd700", glow: "rgba(255,215,0,0.45)" },
      },
      fontFamily: { bebas: ["'Bebas Neue'", "cursive"], sans: ["Inter", "sans-serif"] },
      boxShadow: { neon: "0 0 24px rgba(0,230,118,0.35)", gold: "0 0 24px rgba(255,215,0,0.45)" },
    },
  },
  plugins: [],
};

export default config;
