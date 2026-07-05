import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        foreground: "#000000",
        muted: "#4B5563",
        brand: {
          DEFAULT: "#0066FF",
          hover: "#0052CC",
          light: "#E6F0FF",
          muted: "#B3D4FF",
        },
        border: "#F3F4F6",
        purple: { DEFAULT: "#7C3AED", light: "#A78BFA" },
        cyan: { DEFAULT: "#06B6D4", light: "#22D3EE" },
        emerald: { DEFAULT: "#10B981", light: "#34D399" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0, 0, 0, 0.04)",
        soft: "0 4px 24px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
