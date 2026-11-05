// SPIKE (#1532): throwaway. Typed names for the theme's custom properties.
// defineConsts is inlined at compile time, so `colors.accent` becomes
// `var(--inv-accent)` right in the rule (defineVars would declare its own
// variables on :root, where --inv-* don't exist).
import * as stylex from "@stylexjs/stylex";

export const colors = stylex.defineConsts({
  accent: "var(--inv-accent)",
  accentContrast: "var(--inv-accent-contrast)",
  glow: "var(--inv-glow)",
  text: "var(--inv-text)",
  bgPrimary: "var(--inv-bg-primary)",
  bgSecondary: "var(--inv-bg-secondary)",
  bgOpaquePrimary: "var(--inv-bg-opaque-primary)",
  bgButton: "var(--inv-bg-button)",
  controlBorder: "var(--inv-control-border)",
  danger: "var(--inv-danger)",
  warning: "var(--inv-warning)",
  success: "var(--inv-success)",
});
