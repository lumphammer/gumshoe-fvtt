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
  variants: {
    size: {
      large: { backgroundColor: "wallpaper" },
      small: { backgroundColor: "wallpaper" },
      none: { backgroundColor: "transparent" },
    },
  },
  defaultVariants: { size: "large" },
});
