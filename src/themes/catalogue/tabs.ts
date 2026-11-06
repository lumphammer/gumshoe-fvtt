import { defineSlotRecipe } from "@pandacss/dev";

import { paletteVar } from "../palette";

/**
 * **tabs**: a strip of tabs and the content of the selected one
 * (`TabContainer`).
 *
 * Slots: `list` (the strip), `tab` (a label, after its hidden radio),
 * `spacer` (between tabs in a row) and `content`.
 *
 * States, from the DOM: selected (`input:checked + &`), and wrapped into a
 * grid (`[data-wrapped]` on the list, set by the code that measures it). The
 * selected tab is `surface`, like the content, with `accent` ink; the others
 * are a fainter `surface`, with `text` ink. *`tab` is an expected override,
 * selected and not.*
 */
export const tabs = defineSlotRecipe({
  className: "inv-tabs",
  description: "A strip of tabs and the content of the selected one.",
  slots: ["list", "tab", "spacer", "content"],
  base: {
    list: {},
    tab: {
      textStyle: "display",
      fontSize: "1.2em",
      padding: "0.3em",
      textAlign: "center",
      color: "text",
      background: `[oklch(from var(${paletteVar("surface")}) l c h / calc(alpha * 0.8))]`,
      borderRadius: "0.2em 0.2em 0 0",
      cursor: "pointer",
      "[data-wrapped] > &": { borderRadius: "0.2em" },
      "input:checked + &": { background: "surface", color: "accent" },
      "input:disabled + &": { opacity: 0.3, cursor: "default" },
    },
    spacer: {
      width: "0.5em",
      "[data-wrapped] > &": { display: "none" },
    },
    content: {
      background: "surface",
      padding: "0.5em",
    },
  },
});
