import { defineSlotRecipe } from "@pandacss/dev";
import type { ThemeStyle } from "@lumphammer/investigator-fvtt-types";

import { paletteVar } from "../palette";

/**
 * **toggle**: an on/off switch, for a setting that switches something on.
 *
 * Use for: settings and modes ("Edit mode", "Is a Push Pool?").
 * Not for: ticking items in a list (checkbox).
 *
 * Slots: `track` (the switch, a `<button>`) and `thumb`. States
 * (`toggleStates`): `checked` (on): the track is `accent`, and the thumb
 * `onAccent`, at the other end; `disabled` is faded.
 */
export const toggle = defineSlotRecipe({
  className: "inv-toggle",
  description: "An on/off switch.",
  slots: ["track", "thumb"],
  base: {
    track: {
      fontSize: "0.9em",
      width: "3em",
      height: "1.5em",
      padding: "0",
      margin: "0",
      position: "relative",
      top: "0.1em",
      background: "control",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "line",
      borderRadius: "9999px",
      boxShadow: "none",
      cursor: "pointer",
    },
    thumb: {
      display: "block",
      width: "1em",
      height: "1em",
      background: "text",
      borderRadius: "9999px",
      transition: "transform 100ms",
      transform: "translateX(2px)",
      willChange: "transform",
    },
  },
});

/** The toggle's element states (stateLayers.ts). */
export const toggleStates = {
  checked: {
    track: {
      background: `var(${paletteVar("accent")})`,
      borderColor: `var(${paletteVar("accent")})`,
    },
    thumb: {
      transform: "translateX(calc(2em - 5px))",
      background: `var(${paletteVar("onAccent")})`,
    },
  },
  disabled: { track: { opacity: 0.5, cursor: "default" } },
} satisfies Record<string, Record<string, ThemeStyle>>;
