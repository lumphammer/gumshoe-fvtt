import { paletteVar } from "../palette";
import type { Tone } from "./tones";

const palette = (key: Parameters<typeof paletteVar>[0]) =>
  `var(${paletteVar(key)})`;

/**
 * Recipe defaults in plain CSS, for the recipes whose base a V1 theme's
 * overrides restate with V1's opaque surfaces (`fromV1.ts`): an override
 * replaces a base, so it starts from these. The recipes are built from them,
 * with their colours as tokens (strict tokens).
 */

/** What a text field and a dropdown share. */
export const fieldDefaults = {
  font: palette("bodyFont"),
  fontVariantLigatures: "none",
  color: palette("text"),
  padding: "0.1em 0.3em",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: palette("line"),
  // Foundry's own field shadows and outlines: focus is the focusRing's
  boxShadow: "none",
  "&:is(:hover, [data-hover])": { borderColor: palette("line") },
  "&:is(:focus, [data-focus])": {
    borderColor: palette("line"),
    boxShadow: "none",
  },
  "&:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])": {
    opacity: 0.7,
  },
} as const;

/** The grip you drag to reorder a list. */
export const dragHandleDefaults = {
  cursor: "n-resize",
  borderRadius: "0.35em",
  color: palette("textMuted"),
  background: palette("surface"),
  opacity: 0.7,
  "&:is(:hover, [data-hover])": {
    opacity: 1,
    transform: "scale(1.1)",
    color: palette("accent"),
  },
} as const;

/** A callout's tone colour: `line` for neutral. */
export const calloutColorOf = (tone: Tone) =>
  tone === "neutral" ? "line" : tone;

/** A callout's background: a tint of its tone over a surface. */
export const calloutTint = (tone: Tone, surface: string) =>
  `color-mix(in srgb, ${palette(calloutColorOf(tone))} 30%, ${surface})`;
