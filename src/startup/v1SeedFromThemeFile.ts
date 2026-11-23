import type { ThemeSeedV1 } from "@lumphammer/investigator-fvtt-types";

/**
 * What a V1 theme file leaves out: the V1 High Contrast theme's values (it's
 * ThemeV2 now).
 */
const fallback = {
  colors: {
    accent: "#005",
    accentContrast: "white",
    glow: "#bbf",
    wallpaper: "#666",
    text: "#000",
    backgroundButton: "#00000019",
    backgroundPrimary: "#ffffffe5",
    backgroundSecondary: "#ffffffb2",
  },
  logo: {
    backdropStyle: { background: "white" },
    frontTextElementStyle: { color: "#000" },
    rearTextElementStyle: { display: "none" },
    textElementsStyle: { transform: "none" },
  },
  bodyFont: "1.1em sans-serif",
  displayFont: "1.1em sans-serif",
  global: "",
} satisfies Partial<ThemeSeedV1>;

/**
 * A V1 theme from the theme folder (parsed, its `displayName` and
 * `schemaVersion` checked) as a seed, with the V1 High Contrast theme's values
 * (`fallback`) for what's required and missing. A layout it doesn't recognise is refused.
 */
export function v1SeedFromThemeFile(blob: any): ThemeSeedV1 {
  if (
    blob.layout !== undefined &&
    blob.layout !== "standard" &&
    blob.layout !== "full-frame"
  ) {
    throw new Error(`layout "${blob.layout}" not recognised`);
  }
  return {
    colors: { ...fallback.colors, ...blob.colors },
    displayName: blob.displayName,
    largeSheetRootStyle: blob.largeSheetRootStyle ?? {},
    logo: {
      backdropStyle: blob.logo?.backdropStyle ?? fallback.logo.backdropStyle,
      frontTextElementStyle:
        blob.logo?.frontTextElementStyle ?? fallback.logo.frontTextElementStyle,
      rearTextElementStyle:
        blob.logo?.rearTextElementStyle ?? fallback.logo.rearTextElementStyle,
      textElementsStyle:
        blob.logo?.textElementsStyle ?? fallback.logo.textElementsStyle,
    },
    schemaVersion: blob.schemaVersion,
    appWindowStyle: blob.appWindowStyle ?? {},
    bodyFont: blob.bodyFont ?? fallback.bodyFont,
    displayFont: blob.displayFont ?? fallback.displayFont,
    displayFontTextTransform: blob.displayFontTextTransform,
    global: blob.global ?? fallback.global,
    smallSheetRootStyle: blob.smallSheetRootStyle ?? {},
    layout: blob.layout,
  };
}
