import type {
  ThemeCatalogue,
  ThemePalette,
  ThemeV2,
} from "@lumphammer/investigator-fvtt-types";

/** The colours the specs define their test themes with (V1's names). */
export interface TestColors {
  accent: string;
  accentContrast: string;
  glow: string;
  wallpaper: string;
  text: string;
  backgroundButton: string;
  backgroundPrimary: string;
  backgroundSecondary: string;
  controlBorder?: string;
  danger?: string;
}

/** A V2 palette from a spec's colours, by their V1 meanings. */
export const paletteOf = (colors: TestColors): ThemePalette => ({
  polarity: "light",
  wallpaper: colors.wallpaper,
  surface: colors.backgroundPrimary,
  surfaceNested: colors.backgroundSecondary,
  control: colors.backgroundButton,
  text: colors.text,
  accent: colors.accent,
  onAccent: colors.accentContrast,
  line: colors.controlBorder ?? colors.text,
  feedback: colors.glow,
  danger: colors.danger ?? "rgb(255, 0, 0)",
  warning: "rgb(214, 138, 0)",
  success: "rgb(0, 128, 0)",
  info: "rgb(43, 108, 176)",
});

/** A V2 theme for a spec: its colours, and what else it gives. */
export const testTheme = (
  displayName: string,
  colors: TestColors,
  extra: { catalogue?: ThemeCatalogue; globalCss?: string } = {},
): ThemeV2 => ({
  schemaVersion: "v2",
  displayName,
  palette: paletteOf(colors),
  ...extra,
});
