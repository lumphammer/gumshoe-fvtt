import { defineSlotRecipe } from "@pandacss/dev";

import { tabDefaults, unselectedTabBackground } from "./tabDefaults";

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
 * are a fainter `surface` (more so on light themes), with `text` ink
 * (`tabDefaults.ts`). *`tab` is an expected override, selected and not:* an
 * override of it replaces the selected and wrapped looks too.
 */
export const tabs = defineSlotRecipe({
  className: "inv-tabs",
  description: "A strip of tabs and the content of the selected one.",
  slots: ["list", "tab", "spacer", "content"],
  base: {
    list: {},
    tab: {
      ...tabDefaults,
      // the same as the defaults, as tokens (strict tokens)
      color: "text",
      background: `[${unselectedTabBackground}]`,
      ":where(input:checked) + &": { background: "surface", color: "accent" },
      // a state over the tab, so it applies over a theme's override too
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
