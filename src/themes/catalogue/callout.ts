import { defineRecipe } from "@pandacss/dev";

import { paletteVar } from "../palette";
import { type Tone, tones } from "./tones";

/** A callout's tone colour: `line` for neutral. */
const colorOf = (tone: Tone) => (tone === "neutral" ? "line" : tone);

/** A tint of the tone over the solid surface, so text stays legible. */
const tint = (tone: Tone) =>
  `[color-mix(in srgb, var(${paletteVar(colorOf(tone))}) 30%, var(${paletteVar("surfaceSolid")}))]` as const;

/**
 * **callout**: a boxed message about the content around it: a problem, or
 * advice.
 *
 * Use for: why an action can't happen ("Out of ammo"), advice about setup
 * ("You have too many push pools").
 * Not for: "there's nothing here" (emptyState), a label on a thing (badge).
 *
 * Variants: `tone`: `danger` for something that stops an action, `warning`
 * for advice; `info`, `success` and `neutral` as they mean everywhere.
 */
export const callout = defineRecipe({
  className: "inv-callout",
  description: "A boxed message about the content around it.",
  base: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "0.5em",
    color: "text",
    borderLeftWidth: "0.25em",
    borderLeftStyle: "solid",
    padding: "0.2em 0.5em",
    borderRadius: "0.2em",
  },
  variants: {
    tone: Object.fromEntries(
      tones.map((tone) => [
        tone,
        { background: tint(tone), borderLeftColor: colorOf(tone) },
      ]),
    ) as Record<Tone, object>,
  },
  defaultVariants: { tone: "neutral" },
});
