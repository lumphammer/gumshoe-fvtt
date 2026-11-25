import { defineRecipe } from "@pandacss/dev";

/**
 * **portrait**: a document's image on its sheet, the box around the picture
 * (`ImagePickle`): an actor's on the character and party sheets, an item's on
 * its sheet.
 *
 * Variants: `kind`, `actor` or `item`, so a theme can treat them differently
 * (the V1 themes tilt them, like photos resting on the sheet). No transform
 * by default. Its size and place are the call site's.
 * *Expected override:* a theme's tilt, frame or shadow.
 */
export const portrait = defineRecipe({
  className: "inv-portrait",
  description: "A document's image on its sheet.",
  base: {
    borderRadius: "[0.2em]",
    boxShadow: "[0em 0em 0.5em 0.1em rgba(0,0,0,0.5)]",
  },
  variants: {
    kind: {
      actor: {},
      item: {},
    },
  },
  defaultVariants: {
    kind: "actor",
  },
});
