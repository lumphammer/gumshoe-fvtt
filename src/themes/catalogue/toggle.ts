import { defineSlotRecipe } from "@pandacss/dev";

/**
 * **toggle**: an on/off switch, for a setting that switches something on.
 *
 * Use for: settings and modes ("Edit mode", "Is a Push Pool?").
 * Not for: ticking items in a list (checkbox).
 *
 * Slots: `track` (the switch, a `<button>`) and `thumb`. States: on, via
 * `data-state="checked"`: the track is `accent`, the thumb `onAccent`.
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
      "&[data-state=checked]": { background: "accent", borderColor: "accent" },
      _disabled: { opacity: 0.5, cursor: "default" },
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
      "&[data-state=checked]": {
        transform: "translateX(calc(2em - 5px))",
        background: "onAccent",
      },
    },
  },
});
