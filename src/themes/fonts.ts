import type {
  FontVar,
  ThemeFont,
  ThemeFonts,
} from "@lumphammer/investigator-fvtt-types";

/**
 * A theme's fonts are custom properties on the themed root, like its palette
 * (docs/theming.md, "Fonts"). The catalogue reads them through Panda's
 * `body` and `display` text styles, built from `textStyleCss`.
 */
export const textStyleNames = ["body", "display"] as const;
export type TextStyleName = (typeof textStyleNames)[number];

/** A `ThemeFont`'s fields, in the order they're written out. */
export const fontFields = [
  "family",
  "weight",
  "stretch",
  "style",
  "caps",
  "case",
  "letterSpacing",
  "lineHeight",
  "scale",
] as const satisfies readonly (keyof ThemeFont)[];

/** The custom property a text style's field is set in: `--inv-display-family`. */
export const fontVar = (
  style: TextStyleName,
  field: keyof ThemeFont,
): FontVar =>
  `--inv-${style}-${field.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}` as FontVar;

export const baseSizeVar = "--inv-base-size" satisfies FontVar;

/**
 * How big a piece of display text is, as a multiple of the text around it:
 * a number, not inherited, default 1 (`palette.css` registers it). The
 * display style's size is this times its `scale`.
 */
export const displaySizeVar = "--inv-display-size" satisfies FontVar;

/** The display style's font size: its size, times its typeface's scale. */
export const displayFontSize = `calc(1em * var(${displaySizeVar}) * var(${fontVar("display", "scale")}))`;

/** The sheet's text size: the base size, times the body typeface's scale. */
export const bodyFontSize = `calc(var(${baseSizeVar}) * var(${fontVar("body", "scale")}))`;

/**
 * A text style's typeface and setting, as CSS from its custom properties,
 * without a size (the display style's is `displayFontSize`; body text is
 * sized once, on the sheet's root).
 */
export const textStyleCss = (style: TextStyleName) => ({
  fontFamily: `var(${fontVar(style, "family")})`,
  fontWeight: `var(${fontVar(style, "weight")})`,
  fontStretch: `var(${fontVar(style, "stretch")})`,
  fontStyle: `var(${fontVar(style, "style")})`,
  fontVariantCaps: `var(${fontVar(style, "caps")})`,
  textTransform: `var(${fontVar(style, "case")})`,
  letterSpacing: `var(${fontVar(style, "letterSpacing")})`,
  lineHeight: `var(${fontVar(style, "lineHeight")})`,
});

/**
 * A theme's fonts as an inline style for a themed root: each value the theme
 * sets as a custom property (`palette.css` has the defaults).
 */
export function fontsStyle(fonts: ThemeFonts | undefined) {
  const style: Record<string, string> = {};
  if (fonts?.baseSize !== undefined) style[baseSizeVar] = fonts.baseSize;
  for (const name of textStyleNames) {
    const font = fonts?.[name];
    for (const field of fontFields) {
      const value = font?.[field];
      if (value !== undefined) style[fontVar(name, field)] = String(value);
    }
  }
  return style;
}
