import { defineSlotRecipe } from "@pandacss/dev";

import { logoDefaults } from "./logoDefaults";

/**
 * **logo**: the character sheet's logo: the name (and subtext) in large
 * display text, drawn twice, a front copy and a rear one, over a backdrop,
 * for themes' 3D effects, shadows and gradients (`LogoEditable`).
 *
 * Slots: `backdrop`, `text` (the wrapper of both copies), `front_wrapper`,
 * `front` (the name), `front_sub` (the subtext), and the same for `rear`.
 * The layout, the fit and the text's look by default are `LogoEditable`'s,
 * so a slot's override is only what the theme changes.
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
    "rear_wrapper",
    "rear",
    "rear_sub",
  ],
  base: {
    ...logoDefaults,
    // V1's are only for V1: the text is the palette's text colour, and its
    // caret too, unless a theme says otherwise
    text: {},
    front_wrapper: {},
  },
});
