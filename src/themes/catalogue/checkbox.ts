import { defineSlotRecipe } from "@pandacss/dev";

/**
 * **checkbox**: a box that's ticked or not. `Checkbox` hides the real
 * `<input type="checkbox">` and draws the box after it.
 *
 * Use for: yes/no in a list or table (an occupational ability).
 * Not for: settings that switch something on (toggle).
 *
 * Slots: `box` and `tick`, both real elements (not pseudo-elements), so a
 * theme can replace either. States: from the input before the box: checked
 * shows the `accent` tick; disabled is faded.
 */
export const checkbox = defineSlotRecipe({
  className: "inv-checkbox",
  description: "A box that's ticked or not.",
  slots: ["box", "tick"],
  base: {
    box: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "1.1em",
      height: "1.1em",
      verticalAlign: "-2px",
      borderWidth: "2px",
      borderStyle: "solid",
      borderColor: "line",
      borderRadius: "5px",
      background: "control",
      cursor: "pointer",
      "input:disabled + &": { cursor: "default", opacity: 0.5 },
    },
    tick: {
      fontWeight: "bold",
      lineHeight: "1",
      color: "accent",
      visibility: "hidden",
      "input:checked + * > &": { visibility: "visible" },
    },
  },
});
