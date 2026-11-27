import { defineRecipe } from "@pandacss/dev";

import type { ThemeStyle } from "@lumphammer/investigator-fvtt-types";

import { selectedLook } from "./button";
import { type Tone, tones } from "./tones";

type Look = { color: string; background: string; borderColor: string };

/** What each tone looks like at each weight. */
const looks: Record<Tone, Record<"subtle" | "strong", Look>> = {
  neutral: {
    subtle: { color: "text", background: "transparent", borderColor: "line" },
    strong: { color: "text", background: "control", borderColor: "line" },
  },
  ...(Object.fromEntries(
    (["danger", "warning", "success", "info"] as const).map((tone) => {
      const on = `on${tone[0].toUpperCase()}${tone.slice(1)}`;
      return [
        tone,
        {
          subtle: { color: tone, background: "transparent", borderColor: tone },
          strong: { color: on, background: tone, borderColor: tone },
        },
      ];
    }),
  ) as Record<Exclude<Tone, "neutral">, Record<"subtle" | "strong", Look>>),
};

/**
 * **badge**: a short label attached to something, saying what it is or what
 * state it's in: "Boosted", "Hurt", "Broken", an unlock.
 *
 * Use for: one or two words next to the thing they describe.
 * Not for: messages or warnings (a callout), links to documents.
 *
 * Variants: `tone`, `weight` (`subtle` is an outline, `strong` is filled),
 * and `kind`: `label` (the default, fully rounded) or `tag`, for a
 * free-form tag the user wrote (an ability's specialities): square-cornered,
 * with a dashed outline, so it doesn't read as a state.
 * States (`badgeStates`): a badge that can be clicked has
 * `data-interactive` (hover feedback), and if it's a toggle, `aria-pressed`:
 * `pressed` shows it as selected, whatever its tone.
 */
export const badge = defineRecipe({
  className: "inv-badge",
  description: "A short label: a state, a tag, an unlock.",
  base: {
    display: "inline-block",
    fontSize: "0.9em",
    lineHeight: "1",
    padding: "0.1em 0.5em",
    // fully rounded ends, whatever the height
    borderRadius: "9999px",
    borderWidth: "1px",
    borderStyle: "solid",
    whiteSpace: "nowrap",
    textDecoration: "none",
    textShadow: "none",
  },
  variants: {
    tone: Object.fromEntries(tones.map((tone) => [tone, {}])) as Record<
      Tone,
      object
    >,
    weight: { subtle: {}, strong: {} },
    kind: {
      label: {},
      tag: { borderRadius: "standard", borderStyle: "dashed" },
    },
  },
  compoundVariants: [
    ...tones.flatMap((tone) =>
      (["subtle", "strong"] as const).map((weight) => ({
        tone,
        weight,
        css: looks[tone][weight],
      })),
    ),
  ],
  defaultVariants: { tone: "neutral", weight: "subtle", kind: "label" },
});

/** The badge's element states (stateLayers.ts), over every tone. */
export const badgeStates = {
  pressed: selectedLook,
} satisfies Record<string, ThemeStyle>;
