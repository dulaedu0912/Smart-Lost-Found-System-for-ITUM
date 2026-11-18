export const palette = {
  ink: "#0B1B2B",
  body: "#334155",
  muted: "#64748B",
  background: "#F3F6F8",
  surface: "#FFFFFF",
  surfaceMuted: "#F8FAFC",
  border: "#E2E8F0",
  accent: "#0F766E",
  accentSoft: "#D7F0EC",
  accentInk: "#0B4F4A",
  lost: "#B45309",
  lostSoft: "#FEF3E2",
  found: "#0F766E",
  foundSoft: "#DCF5F0",
  danger: "#B42318",
  dangerSoft: "#FEE4E2",
  white: "#FFFFFF",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  full: 999,
} as const;

export const shadow = {
  card: "0 1px 2px rgba(11, 27, 43, 0.04), 0 12px 28px rgba(11, 27, 43, 0.06)",
  raised: "0 2px 4px rgba(11, 27, 43, 0.06), 0 18px 40px rgba(11, 27, 43, 0.1)",
} as const;
