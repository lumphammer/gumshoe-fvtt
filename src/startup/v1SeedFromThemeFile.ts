import type { ThemeSeedV1 } from "@lumphammer/investigator-fvtt-types";

import { highContrastTheme } from "../themes/highContrastTheme";

/**
 * A V1 theme from the theme folder (parsed, its `displayName` and
 * `schemaVersion` checked) as a seed, with High Contrast's values for what's
 * required and missing. A layout it doesn't recognise is refused.
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
    colors: {
      accent: highContrastTheme.colors.accent,
      accentContrast: highContrastTheme.colors.accentContrast,
      glow: highContrastTheme.colors.glow,
      wallpaper: highContrastTheme.colors.wallpaper,
      text: highContrastTheme.colors.text,
      backgroundButton: highContrastTheme.colors.backgroundButton,
      backgroundPrimary: highContrastTheme.colors.backgroundPrimary,
      backgroundSecondary: highContrastTheme.colors.backgroundSecondary,
      ...blob.colors,
    },
    displayName: blob.displayName,
    largeSheetRootStyle: blob.largeSheetRootStyle ?? {},
    logo: {
      backdropStyle:
        blob.logo?.backdropStyle ?? highContrastTheme.logo.backdropStyle,
      frontTextElementStyle:
        blob.logo?.frontTextElementStyle ??
        highContrastTheme.logo.frontTextElementStyle,
      rearTextElementStyle:
        blob.logo?.rearTextElementStyle ??
        highContrastTheme.logo.rearTextElementStyle,
      textElementsStyle:
        blob.logo?.textElementsStyle ??
        highContrastTheme.logo.textElementsStyle,
    },
    schemaVersion: blob.schemaVersion,
    appWindowStyle: blob.appWindowStyle ?? {},
    bodyFont: blob.bodyFont ?? highContrastTheme.bodyFont,
    displayFont: blob.displayFont ?? highContrastTheme.displayFont,
    displayFontTextTransform: blob.displayFontTextTransform,
    global: blob.global ?? highContrastTheme.global,
    smallSheetRootStyle: blob.smallSheetRootStyle ?? {},
    layout: blob.layout,
  };
}
