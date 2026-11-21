import { defineSlotRecipe } from "@pandacss/dev";
import type { ThemeStyle } from "@lumphammer/investigator-fvtt-types";

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
 * States (`tabsStates`), on the tab: `selected` is `surface`, like the
 * content, with `accent` ink (the others are a fainter `surface`, with
 * `text` ink); `disabled` (its radio is) is faded. When the strip is wrapped
 * into a grid, the list, the tabs, the spacers and the content all have
 * `data-wrapped` (`&[data-wrapped]`; set by the code that measures it): a
 * layout, not a state. *`tab` is an expected override, and so is its
 * `selected` state.*
 */
export const tabs = defineSlotRecipe({
  className: "inv-tabs",
  description: "A strip of tabs and the content of the selected one.",
  slots: ["list", "tab", "spacer", "content"],
  base: {
    list: {},
    tab: {
      textStyle: "display",
      "--inv-display-size": "1.2",
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
      // part of the tab's look: no more specific than the tab, so what a
      // theme's override of `tab` sets goes over it too
      "&:where([data-wrapped])": { borderRadius: "0.2em" },
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

/** The tabs' element states (stateLayers.ts), on the tab. */
export const tabsStates = {
  selected: {
    tab: {
      background: `var(${paletteVar("surface")})`,
      color: `var(${paletteVar("accent")})`,
    },
  },
  disabled: { tab: { opacity: 0.3, cursor: "default" } },
} satisfies Record<string, Record<string, ThemeStyle>>;
