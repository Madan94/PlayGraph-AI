import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#09090B",
        foreground: "#FAFAFA",
        purple: { DEFAULT: "#7C3AED", light: "#A78BFA" },
        cyan: { DEFAULT: "#06B6D4", light: "#22D3EE" },
        emerald: { DEFAULT: "#10B981", light: "#34D399" },
      },
      borderRadius: { xl: "20px", "2xl": "24px" },
    },
  },
  plugins: [],
};
export default config;
