import { defineSlotRecipe } from "@pandacss/dev";

/**
 * The window, when its titlebar is see-through, over the content: it has
 * something to drag it by (`data-inv-window-handle`, the logo), and isn't
 * minimized or detached (Foundry's detached windows' bodies are `.detached`:
 * one has no position of its own to drag). Otherwise, it keeps the standard
 * titlebar.
 */
const overlaid =
  ":where(body:not(.detached) .application:not(.minimized):has([data-inv-window-handle])) > &";

/**
 * **appFrame**: Foundry's window around a themed root: the application
 * element (`root`), its titlebar (`header`) and the area our root sits in
 * (`content`). `CSSReset` puts these classes on Foundry's elements, and
 * `data-inv-frame` (with the palette) on the window, not `data-inv-theme`: the
 * frame is Foundry's, so it doesn't get our element defaults.
 *
 * Variant `layout` is the theme's (`ThemeV2.layout`): `standard` is
 * Foundry's own titlebar; `full-frame`'s is see-through, over the top of the
 * content, with only its buttons taking clicks, and no title. The window is
 * dragged by the content's logo instead (`frame.ts`). The sheet keeps its
 * own content clear of the buttons (`--inv-window-controls-width`).
 *
 * Empty by default: a window looks like Foundry's own. *Expected override:* a
 * theme's glow or border goes on `root`.
 */
export const appFrame = defineSlotRecipe({
  className: "inv-app-frame",
  description: "Foundry's window around a themed root.",
  slots: ["root", "header", "content"],
  base: { root: {}, header: {}, content: {} },
  variants: {
    layout: {
      standard: {},
      "full-frame": {
        header: {
          // the buttons stacked down the window's right edge, over the end of
          // the logo, which keeps clear of them
          [overlaid]: {
            position: "absolute",
            top: "0",
            right: "0",
            zIndex: 1,
            flexDirection: "column-reverse",
            alignItems: "center",
            width: "auto",
            height: "auto",
            pointerEvents: "none",
            background: "[transparent]",
            borderBottom: "none",
            "& .window-title, & .window-icon": { display: "none" },
            // on the sheet's wallpaper, not Foundry's header
            "& .header-control": { pointerEvents: "auto", color: "text" },
          },
        },
        content: {
          [overlaid]: { position: "absolute", inset: "0" },
        },
      },
    },
  },
  defaultVariants: { layout: "standard" },
});
