import { defineSlotRecipe } from "@pandacss/dev";

/**
 * **appFrame**: Foundry's window around a themed root: the application
 * element (`root`), its titlebar (`header`) and the area our root sits in
 * (`content`). `CSSReset` puts these classes on Foundry's elements, and
 * `data-inv-frame` (with the palette) on the window, not `data-inv-theme`: the
 * frame is Foundry's, so it doesn't get our element defaults.
 *
 * Empty by default: a window looks like Foundry's own. *Expected override:* a
 * theme's glow or border goes on `root`.
 */
export const appFrame = defineSlotRecipe({
  className: "inv-app-frame",
  description: "Foundry's window around a themed root.",
  slots: ["root", "header", "content"],
  base: { root: {}, header: {}, content: {} },
});
