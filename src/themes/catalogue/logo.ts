import type { ThemeStyle } from "@lumphammer/investigator-fvtt-types";
import { defineSlotRecipe } from "@pandacss/dev";

import { logoDefaults } from "./logoDefaults";

/**
 * **logo**: the character sheet's logo: the name (and subtext) in large
 * display text, drawn twice, a front copy and a rear one, over a backdrop,
 * for themes' 3D effects, shadows and gradients (`LogoEditable`).
 *
 * Slots: `root` (the outer box, with the perspective for the text's 3D
 * transforms; its size is the call site's), `backdrop`, `text` (the wrapper
 * of both copies), `front_wrapper`,
 * `front` (the name), `front_sub` (the subtext), and the same for `rear`.
 * The layout, the fit and the text's look by default are `LogoEditable`'s,
 * so a slot's override is only what the theme changes.
 * *Expected override, every slot:* a theme's logo is its own.
 *
 * States (`logoStates`): the name, when it can be edited, and the subtext,
 * when it can be clicked, have `data-interactive`, so `hoverFeedback` shows
 * on their front copies.
 */
export const logo = defineSlotRecipe({
  className: "inv-logo",
  description: "The character sheet's logo.",
  slots: [
    "root",
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

/**
 * A tint over the hovered part, not a glow around it: an inset shadow, which
 * goes over the part's background, so a theme's gradient, clipped to the
 * text (on the part, or its wrapper), still shows, tinted. The name is a text
 * box, so it keeps the text cursor.
 */
const tint: ThemeStyle = {
  boxShadow:
    "inset 0 0 0 100vmax color-mix(in srgb, var(--inv-feedback) 15%, transparent)",
  borderRadius: "0.1em",
};

export const logoStates = {
  hoverFeedback: {
    front: { ...tint, cursor: "text" },
    front_sub: tint,
  },
} satisfies Record<string, Record<string, ThemeStyle>>;
