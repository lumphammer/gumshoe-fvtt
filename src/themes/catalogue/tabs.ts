import { defineSlotRecipe } from "@pandacss/dev";

import { paletteVar } from "../palette";

/** `surface` with its opacity scaled. */
const fadedSurface = (scale: number) =>
  `oklch(from var(${paletteVar("surface")}) l c h / calc(alpha * ${scale}))`;

/**
 * **tabs**: a strip of tabs and the content of the selected one
 * (`TabContainer`).
 *
 * Slots: `list` (the strip), `tab` (a label, after its hidden radio),
 * `spacer` (between tabs in a row) and `content`.
 *
 * States, as attributes on the elements themselves: the selected tab has
 * `data-selected` (`&[data-selected]`), and when the strip is wrapped into a
 * grid, the list, the tabs, the spacers and the content all have
 * `data-wrapped` (`&[data-wrapped]`; set by the code that measures it). The
 * selected tab is `surface`, like the content, with `accent` ink; the others
 * are a fainter `surface`, with `text` ink. *`tab` is an expected override,
 * selected and not:* an override of it replaces the selected and wrapped
 * looks too.
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
      // light themes' surfaces are usually pale and close to the wallpaper,
      // so they need more fading to tell from the selected tab; on dark ones,
      // as much would make the tabs vanish. `light-dark()` picks by the
      // `color-scheme` the palette's `polarity` sets on the themed root
      background: `[light-dark(${fadedSurface(0.4)}, ${fadedSurface(0.8)})]`,
      borderRadius: "0.2em 0.2em 0 0",
      cursor: "pointer",
      // part of the tab's look, not states laid over it: their context is in
      // :where(), so they're no more specific than the tab, and a theme's
      // override of `tab` replaces them too
      "&:where([data-wrapped])": { borderRadius: "0.2em" },
      "&:where([data-selected])": { background: "surface", color: "accent" },
      // a state over the tab, so it applies over a theme's override too
      "input:disabled + &": { opacity: 0.3, cursor: "default" },
    },
    spacer: {
      width: "0.5em",
      "&[data-wrapped]": { display: "none" },
    },
    content: {
      background: "surface",
      padding: "0.5em",
    },
  },
});
