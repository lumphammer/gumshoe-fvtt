import { defineRecipe } from "@pandacss/dev";

/**
 * **sheetRoot**: the themed root of a window: its ink, body text style, and
 * the wallpaper behind everything. It's the element that carries
 * `data-inv-theme` and the palette's custom properties (`CSSReset`).
 *
 * Variants: `size`: `large` (a full sheet) and `small` (a small window, like
 * a dialog) are on `wallpaper`; `none` (a themed area inside something else)
 * is transparent. *Expected override:* a theme's backdrop image goes in its
 * `size` variants.
 */
export const sheetRoot = defineRecipe({
  className: "inv-sheet-root",
  description: "The themed root of a window.",
  base: {
    textStyle: "body",
    color: "text",
    accentColor: "accent",
  },
  // padding and height are layout, but in the size variants, so a V1 theme's
  // root style (a patch of them) can still set them, as it could in V1
  variants: {
    size: {
      large: { backgroundColor: "wallpaper", padding: "0.5em", height: "100%" },
      small: { backgroundColor: "wallpaper", padding: "0.5em", height: "100%" },
      none: { backgroundColor: "transparent", padding: "0", height: "100%" },
    },
  },
  defaultVariants: { size: "large" },
});
