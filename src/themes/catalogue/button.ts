import { defineRecipe } from "@pandacss/dev";
import type { ThemeStyle } from "@lumphammer/investigator-fvtt-types";

import { paletteVar } from "../palette";

/**
 * **button**: something you click to do something.
 *
 * Use for: actions on a sheet, panel or toolbar.
 * Not for: links to documents (a link), on/off settings (a toggle).
 *
 * Variants: `kind`:
 * - `default`: an ordinary action.
 * - `cta`: the call to action: what you're probably about to click if you're
 *   looking at this UI, such as the button that commits a panel ("Rebuild
 *   Bond", "Test"). One per panel at most.
 * - `toolbar`: compact, for a row of tools.
 * - `ghost`: no fill or border, just the ink: icon buttons such as delete.
 * - `pip`: one of a row of small number picks (a pool tracker's boxes).
 *
 * States (`buttonStates`): `pressed` (`aria-pressed="true"`, or
 * `data-pressed` on a label standing for a checked radio) shows as
 * selected, whatever the kind; `disabled` is faded. Hover and focus come
 * from the state layers.
 */
export const button = defineRecipe({
  className: "inv-button",
  description: "Something you click to do something.",
  base: {
    textStyle: "display",
    color: "text",
    background: "control",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "line",
    borderRadius: "standard",
    padding: "0.1em 0.3em",
    // Foundry's own button shadows
    boxShadow: "none",
    textShadow: "none",
    cursor: "pointer",
  },
  variants: {
    kind: {
      default: {},
      cta: { color: "onAccent", background: "accent", borderColor: "accent" },
      toolbar: { padding: "0.3em", lineHeight: "1em" },
      ghost: { background: "transparent", borderColor: "transparent" },
      pip: {
        textStyle: "body",
        fontSize: "inherit",
        padding: "0",
        borderRadius: "0",
        borderColor: "transparent",
        background: "surface",
        textAlign: "right",
        paddingRight: "0.5em",
      },
    },
  },
  defaultVariants: { kind: "default" },
});

/** Selected: an `accent` fill with `onAccent` ink. */
export const selectedLook = {
  color: `var(${paletteVar("onAccent")})`,
  background: `var(${paletteVar("accent")})`,
  borderColor: `var(${paletteVar("accent")})`,
} satisfies ThemeStyle;

/** The button's element states (stateLayers.ts), over every kind. */
export const buttonStates = {
  pressed: selectedLook,
  disabled: { opacity: 0.5, cursor: "default" },
} satisfies Record<string, ThemeStyle>;
