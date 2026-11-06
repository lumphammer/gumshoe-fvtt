import { defineRecipe } from "@pandacss/dev";

/**
 * **panel**: a block of content on the sheet.
 *
 * Use for: an area of a sheet (stats, pools), a box of controls (an ability
 * test, a weapon's attack).
 * Not for: things raised above the sheet (floating), boxed messages
 * (callout).
 *
 * Variants: `depth`, which the call site never chooses: `<Panel>` works it
 * out from the structure.
 * - `top`: content on the sheet: `surface`.
 * - `nested`: content inside content (another panel, a tab's content):
 *   `surfaceNested`.
 */
export const panel = defineRecipe({
  className: "inv-panel",
  description: "A block of content on the sheet.",
  base: {
    background: "surface",
    padding: "0.5em",
  },
  variants: {
    depth: {
      top: {},
      nested: { background: "surfaceNested" },
    },
  },
  defaultVariants: { depth: "top" },
});
