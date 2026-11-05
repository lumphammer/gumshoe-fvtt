import { defineRecipe } from "@pandacss/dev";

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
 *
 * States: `:disabled`. Hover and focus come from the state layers.
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
    _disabled: { opacity: 0.5, cursor: "default" },
  },
  variants: {
    kind: {
      default: {},
      cta: { color: "onAccent", background: "accent", borderColor: "accent" },
      toolbar: { padding: "0.3em", lineHeight: "1em" },
      ghost: { background: "transparent", borderColor: "transparent" },
    },
  },
  defaultVariants: { kind: "default" },
});
