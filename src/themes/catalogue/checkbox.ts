import { defineRecipe } from "@pandacss/dev";

/**
 * **checkbox**: a box that's ticked or not. Applied to the element that
 * stands for a visually hidden `<input type="checkbox">` just before it
 * (`Checkbox`): the box is its `::before`, the tick its `::after`.
 *
 * Use for: yes/no in a list or table (an occupational ability).
 * Not for: settings that switch something on (toggle).
 *
 * States: from the input: checked shows an `accent` tick; disabled is faded.
 */
export const checkbox = defineRecipe({
  className: "inv-checkbox",
  description: "A box that's ticked or not.",
  base: {
    cursor: "pointer",
    color: "text",
    "&::before": {
      content: "''",
      display: "inline-block",
      width: "1.1em",
      height: "1.1em",
      verticalAlign: "-2px",
      borderWidth: "2px",
      borderStyle: "solid",
      borderColor: "line",
      borderRadius: "5px",
      background: "control",
    },
    "input:checked + &::after": {
      content: "'✓'",
      fontWeight: "bold",
      color: "accent",
      position: "absolute",
      top: "0",
      left: "0.3em",
    },
    "input:disabled + &": { cursor: "default", opacity: 0.5 },
  },
});
