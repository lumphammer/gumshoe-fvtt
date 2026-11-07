import { paletteVar } from "../palette";

/** `surface` with its opacity scaled. */
const fadedSurface = (scale: number) =>
  `oklch(from var(${paletteVar("surface")}) l c h / calc(alpha * ${scale}))`;

/**
 * An unselected tab's background: a fainter `surface`. Light themes' surfaces
 * are usually pale and close to the wallpaper, so they need more fading to
 * tell from the selected tab; on dark ones, as much would make the tabs
 * vanish. `light-dark()` picks by the `color-scheme` the palette's `polarity`
 * sets on the themed root.
 */
export const unselectedTabBackground = `light-dark(${fadedSurface(0.4)}, ${fadedSurface(0.8)})`;

/**
 * The tab's default look, in plain CSS: the `tabs` recipe is built from it,
 * and a V1 theme's tab override starts from it (an override replaces the
 * slot's default, selected look and all). The selected and wrapped looks put
 * their context in `:where()`, so they're part of the tab's rule rather than
 * states over it, and a theme's override of `tab` replaces them too.
 */
export const tabDefaults = {
  // the `display` text style
  font: `var(${paletteVar("displayFont")})`,
  textTransform: `var(${paletteVar("displayCase")})`,
  letterSpacing: `var(${paletteVar("displayLetterSpacing")})`,
  fontSize: "1.2em",
  padding: "0.3em",
  textAlign: "center",
  color: `var(${paletteVar("text")})`,
  background: unselectedTabBackground,
  borderRadius: "0.2em 0.2em 0 0",
  cursor: "pointer",
  ":where([data-wrapped]) > &": { borderRadius: "0.2em" },
  ":where(input:checked) + &": {
    background: `var(${paletteVar("surface")})`,
    color: `var(${paletteVar("accent")})`,
  },
} as const;
