export const palette = {
  purple: "#7C3AED",
  purpleLight: "#A78BFA",
  cyan: "#06B6D4",
  cyanLight: "#22D3EE",
  emerald: "#10B981",
  emeraldLight: "#34D399",
  danger: "#F87171",
};

export interface Theme {
  mode: "dark" | "light";
  background: string;
  surface: string;
  surfaceBorder: string;
  foreground: string;
  muted: string;
  mutedFaint: string;
  divider: string;
  purple: string;
  purpleLight: string;
  cyan: string;
  cyanLight: string;
  emerald: string;
  emeraldLight: string;
  danger: string;
}

export const darkTheme: Theme = {
  mode: "dark",
  background: "#09090B",
  surface: "rgba(255,255,255,0.06)",
  surfaceBorder: "rgba(255,255,255,0.10)",
  foreground: "#FAFAFA",
  muted: "rgba(250,250,250,0.5)",
  mutedFaint: "rgba(250,250,250,0.35)",
  divider: "rgba(255,255,255,0.10)",
  ...palette,
};

export const lightTheme: Theme = {
  mode: "light",
  background: "#F5F5F7",
  surface: "rgba(255,255,255,0.75)",
  surfaceBorder: "rgba(9,9,11,0.08)",
  foreground: "#09090B",
  muted: "rgba(9,9,11,0.55)",
  mutedFaint: "rgba(9,9,11,0.38)",
  divider: "rgba(9,9,11,0.08)",
  ...palette,
};
