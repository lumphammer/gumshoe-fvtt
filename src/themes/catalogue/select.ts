import { defineRecipe } from "@pandacss/dev";

import { fieldBase } from "./input";

/**
 * **select**: a dropdown, for choosing one of a list.
 *
 * Use for: a choice from a fixed or long list.
 * Not for: a handful of numbers side by side (CheckButtons), on/off (toggle).
 *
 * On `surfaceNestedSolid`, with its options on `surfaceSolid`: a native
 * dropdown doesn't show what's behind it.
 */
export const select = defineRecipe({
  className: "inv-select",
  description: "A dropdown, for choosing one of a list.",
  base: {
    ...fieldBase,
    background: "surfaceNestedSolid",
    "& option": { background: "surfaceSolid", color: "text" },
  },
});
