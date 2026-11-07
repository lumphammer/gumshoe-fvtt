import { defineSlotRecipe } from "@pandacss/dev";

import { logoDefaults, measureForced } from "./logoDefaults";

/**
 * **logo**: the character sheet's logo: the name (and subtext) in large
 * display text, drawn twice, a front copy and a rear one, over a backdrop,
 * for themes' 3D effects, shadows and gradients (`LogoEditable`).
 *
 * Slots: `backdrop`, `text` (the wrapper of both copies), `front_wrapper`,
 * `front` (the name), `front_sub` (the subtext), and the same for `rear`;
 * `measure`, a hidden full-size copy of the name that `LogoEditable`
 * measures to fit it.
 * *Expected override, every slot:* a theme's logo is its own.
 */
export const logo = defineSlotRecipe({
  className: "inv-logo",
  description: "The character sheet's logo.",
  slots: [
    "backdrop",
    "text",
    "front_wrapper",
    "front",
    "front_sub",
    "measure",
    "rear_wrapper",
    "rear",
    "rear_sub",
  ],
  base: {
    ...logoDefaults,
    // strictTokens: colours that aren't palette tokens need escaping
    text: { ...logoDefaults.text, caretColor: "[black]" },
    front_wrapper: { ...logoDefaults.front_wrapper, color: "[transparent]" },
    rear_wrapper: { ...logoDefaults.rear_wrapper, color: "[transparent]" },
    measure: { ...logoDefaults.measure, ...measureForced },
  },
});
