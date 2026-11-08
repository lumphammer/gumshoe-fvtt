import { defineRecipe } from "@pandacss/dev";

import { fieldBase } from "./input";

/**
 * **select**: a dropdown, for choosing one of a list.
 *
 * Use for: a choice from a fixed or long list.
 * Not for: a handful of numbers side by side (CheckButtons), on/off (toggle).
 *
 * On `surfaceNested`, with its options on `surface`.
 */
export const select = defineRecipe({
  className: "inv-select",
  description: "A dropdown, for choosing one of a list.",
  base: {
    ...fieldBase,
    background: "surfaceNested",
    "& option": { background: "surface", color: "text" },
  },
});
