import { defineRecipe } from "@pandacss/dev";

import { bodyFontSize } from "../fonts";

/**
 * **sheetRoot**: the themed root of a window: its ink, body text style, and
 * the wallpaper behind everything. It's the element that carries
 * `data-inv-theme` and the palette's custom properties (`CSSReset`).
 *
 * Variant `sheet`: what kind of window it is, each with its own promise about
 * what's on the wallpaper (docs/theming.md), so a theme can give each its
 * own backdrop:
 * - `character`: a PC's or NPC's sheet. On the wallpaper, only regions, tabs,
 *   the portrait and the logo.
 * - `item`: an item's sheet (`ItemSheetFramework`, or a card). A header (the
 *   image and the name) on the wallpaper, over a region, though an item's
 *   sheet may have text and controls straight on the wallpaper too.
 * - `freeform`: anything else (the party sheet, the settings, the journal
 *   editor, the Team Crisis window). Assume nothing about the layout.
 *
 * *Expected override:* a theme's backdrop image goes in the `sheet` variants.
 */
const wallpaper = {
  backgroundColor: "wallpaper",
  padding: "0.5em",
  height: "100%",
} as const;

export const sheetRoot = defineRecipe({
  className: "inv-sheet-root",
  description: "The themed root of a window.",
  base: {
    textStyle: "body",
    // the theme's base size, which all the sheet's text is relative to
    fontSize: bodyFontSize,
    color: "text",
    accentColor: "accent",
  },
  // padding and height are layout, but in the variants, so a V1 theme's root
  // style (a patch of them) can still set them, as it could in V1
  variants: {
    sheet: {
      character: wallpaper,
      item: wallpaper,
      freeform: wallpaper,
    },
  },
  defaultVariants: { sheet: "freeform" },
});
