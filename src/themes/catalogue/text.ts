import { defineRecipe } from "@pandacss/dev";

import { tones } from "./tones";

/**
 * **displayText**: text in the `display` style that isn't a heading: labels
 * over columns ("Rating", "Oc."), figures (build points), menu entries.
 *
 * Variants: `size`: `sm` (smaller than around it), `md`, `lg` (larger).
 * Not for: headings (h1 to h4 get the display style already).
 */
export const displayText = defineRecipe({
  className: "inv-display-text",
  description: "Text in the display style that isn't a heading.",
  base: { textStyle: "display" },
  variants: {
    size: {
      sm: { fontSize: "smaller" },
      md: {},
      lg: { fontSize: "larger" },
    },
  },
  defaultVariants: { size: "md" },
});

/**
 * **mutedText**: secondary information within content: a description under
 * a menu entry, a summary beside it, a note. `textMuted` ink.
 *
 * Variants: `size`: `sm` is a little smaller.
 * Not for: things that are switched off or unavailable (those are states of
 * their own class, e.g. disabled).
 */
export const mutedText = defineRecipe({
  className: "inv-muted-text",
  description: "Secondary information within content.",
  base: { color: "textMuted" },
  variants: {
    size: { sm: { fontSize: "0.9em" }, md: {} },
  },
  defaultVariants: { size: "md" },
});

/**
 * **outcome**: the result of something, in its tone's ink: a goal met
 * (`success`), a limit passed (`danger`), something missing (`warning`).
 *
 * Variants: `tone`; `neutral` is plain `text`.
 * Not for: a label on a thing (badge), a message about it (callout).
 */
export const outcome = defineRecipe({
  className: "inv-outcome",
  description: "The result of something, in its tone's ink.",
  base: {},
  variants: {
    tone: Object.fromEntries(
      tones.map((tone) => [
        tone,
        { color: tone === "neutral" ? "text" : tone },
      ]),
    ) as Record<(typeof tones)[number], object>,
  },
  defaultVariants: { tone: "neutral" },
});
