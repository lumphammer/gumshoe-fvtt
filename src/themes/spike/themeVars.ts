// SPIKE (#1532): throwaway. Theme values as CSS custom properties, so
// component styles can be static. Both engine spikes build on this.

import type { ThemeV1 } from "../types";

/** A stable id for a theme, for `data-inv-theme`. */
export const themeSlug = (theme: ThemeV1) =>
  theme.displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** The theme's values, as custom properties to set on a themed root. */
export const themeToCssVars = (theme: ThemeV1): Record<string, string> => ({
  "--inv-accent": theme.colors.accent,
  "--inv-accent-contrast": theme.colors.accentContrast,
  "--inv-glow": theme.colors.glow,
  "--inv-text": theme.colors.text,
  "--inv-wallpaper": theme.colors.wallpaper,
  "--inv-bg-primary": theme.colors.backgroundPrimary,
  "--inv-bg-secondary": theme.colors.backgroundSecondary,
  "--inv-bg-opaque-primary": theme.colors.bgOpaquePrimary,
  "--inv-bg-opaque-secondary": theme.colors.bgOpaqueSecondary,
  "--inv-bg-button": theme.colors.backgroundButton,
  "--inv-control-border": theme.colors.controlBorder,
  "--inv-danger": theme.colors.danger,
  "--inv-warning": theme.colors.warning,
  "--inv-success": theme.colors.success,
  "--inv-body-font": theme.bodyFont ?? "inherit",
  "--inv-display-font": theme.displayFont ?? "inherit",
  "--inv-display-transform": String(theme.displayFontTextTransform ?? "none"),
});
