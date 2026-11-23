import { defineSlotRecipe } from "@pandacss/dev";

/**
 * The window, when its titlebar is see-through, over the content: its content
 * leaves room for it (`data-inv-clears-titlebar`: the PC and NPC sheets' logo,
 * or an item sheet's root, `CSSReset`), and it isn't
 * minimized. Otherwise, it keeps the standard titlebar.
 */
const overlaid =
  ":where(.application:not(.minimized):has([data-inv-clears-titlebar])) > &";

/**
 * **appFrame**: Foundry's window around a themed root: the application
 * element (`root`), its titlebar (`header`) and the area our root sits in
 * (`content`). `CSSReset` puts these classes on Foundry's elements, and
 * `data-inv-frame` (with the palette) on the window, not `data-inv-theme`: the
 * frame is Foundry's, so it doesn't get our element defaults.
 *
 * Variant `layout` is the theme's (`ThemeV2.layout`): `standard` is
 * Foundry's own titlebar; `full-frame`'s is a see-through strip across the
 * top of the content, still the titlebar (it drags the window, and a double
 * click minimizes it), with no title, and a faint tint on hover to show where
 * it is. The sheet's logo keeps its text below it (`LogoEditable`). The
 * strip's buttons and tint are in `--inv-titlebar-ink`, `text` unless a theme
 * sets it on `header`, as what's under the strip is the theme's backdrop.
 *
 * Variant `sheet` is the themed root's (`sheetRoot`): what kind of window it
 * is, so a theme can style each one's frame to go with its backdrop (the
 * strip's ink, say, in a compound variant with `layout: full-frame`).
 *
 * Empty by default: a window looks like Foundry's own. *Expected override:* a
 * theme's glow or border goes on `root`; its titlebar's tint on `header`.
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
          // a strip across the top, as tall as Foundry's own titlebar, its
          // buttons in a row at the right, with room for a module's to the
          // left of them
          [overlaid]: {
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            zIndex: 1,
            height: "[var(--header-height)]",
            background: "[transparent]",
            borderBottom: "none",
            transition: "[background-color 0.2s]",
            "&:hover": {
              backgroundColor:
                "[color-mix(in srgb, var(--inv-titlebar-ink, var(--inv-text)) 8%, transparent)]",
            },
            // keeping its place, so the buttons stay at the right
            "& .window-title": { visibility: "hidden" },
            "& .window-icon": { display: "none" },
            // on the sheet's wallpaper, not Foundry's header
            "& .header-control": {
              color: "[var(--inv-titlebar-ink, var(--inv-text))]",
            },
          },
        },
        content: {
          // its own stacking context, under the strip: nothing in it (a
          // drawer sliding in, say) can come up over the window's buttons
          [overlaid]: { position: "absolute", inset: "0", zIndex: 0 },
        },
      },
    },
    sheet: {
      character: {},
      item: {},
      freeform: {},
    },
  },
  defaultVariants: { layout: "standard", sheet: "freeform" },
});
