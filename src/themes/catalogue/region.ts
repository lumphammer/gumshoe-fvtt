import { defineRecipe } from "@pandacss/dev";

/**
 * **region**: an area of a sheet's layout, on the wallpaper, which the
 * sheet's content sits in.
 *
 * Use for: the areas a sheet is divided into (a character's stats, pools or
 * sidebar; the body of an item's sheet). `<Region>` applies it.
 * Not for: a box of controls or content within an area (panel); a tab's
 * content, which is an area too, but the `tabs` recipe's own (`content`).
 *
 * Regions don't nest. A theme may make one solid, tinted or transparent: it's
 * the theme's job to keep text and controls legible on it.
 */
export const region = defineRecipe({
  className: "inv-region",
  description: "An area of a sheet's layout.",
  base: {
    background: "surface",
    padding: "0.5em",
  },
});
