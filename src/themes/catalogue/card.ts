import { defineSlotRecipe } from "@pandacss/dev";

/**
 * **card**: a card (Cards rules): a supertitle, title and subtitle, and in
 * full view its description and effect (`CardDisplay`).
 *
 * Slots: `root`, `supertitle`, `title`, `subtitle`, `description`, `effect`.
 * The root has `data-category` (the card's style key), so a theme can style
 * a category's cards: `&[data-category="x"]` on the root, `[data-category="x"]
 * &` on the other slots. The base catalogue defines no categories.
 * *`root` is an expected override.*
 */
export const card = defineSlotRecipe({
  className: "inv-card",
  description: "A card.",
  slots: ["root", "supertitle", "title", "subtitle", "description", "effect"],
  base: {
    root: {
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "line",
      padding: "0.5em",
      transformOrigin: "top",
      backgroundColor: "surfaceSolid",
    },
    supertitle: { fontSize: "0.9em" },
    title: {},
    subtitle: { fontWeight: "bold" },
    description: {},
    effect: { fontStyle: "italic" },
  },
});
