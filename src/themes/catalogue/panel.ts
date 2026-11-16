import { defineRecipe } from "@pandacss/dev";

/**
 * **panel**: a box of controls or content, within an area of a sheet.
 *
 * Use for: a group of controls (an ability test, a weapon's attack), or of
 * content that belongs together (the ready weapon). `<Panel>` applies it.
 * Not for: an area of the sheet's layout (region); things raised above the
 * sheet (floating); boxed messages (callout).
 *
 * Always inside a region, or a tab's content: never straight on the
 * wallpaper, where a theme doesn't promise it's legible. A panel inside a
 * panel looks the same as its parent.
 */
export const panel = defineRecipe({
  className: "inv-panel",
  description: "A box of controls or content, within an area of a sheet.",
  base: {
    background: "surfaceNested",
    padding: "0.5em",
  },
});
