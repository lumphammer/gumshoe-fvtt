import { defineSlotRecipe } from "@pandacss/dev";

/**
 * **fieldGrid**: a form laid out as a grid of labelled fields, labels in one
 * column and their controls in the next (`InputGrid`, `GridField`,
 * `GridFieldStacked`).
 *
 * Slots: `root` (the grid), `label` and `control` (the cell holding the
 * input). The grid's structure (its `display` and columns, and which column a
 * label or control sits in) belongs to the components, not the recipe: a
 * theme can set the gaps, and the label's and control's alignment and look,
 * but not move them out of their columns.
 *
 * `stacked`: a field whose label sits above its control, across both columns
 * (`GridFieldStacked`), so it isn't aligned towards the control.
 */
export const fieldGrid = defineSlotRecipe({
  className: "inv-field-grid",
  description: "A grid of labelled fields.",
  slots: ["root", "label", "control"],
  base: {
    root: {
      rowGap: "0.2em",
    },
    label: {
      paddingTop: "0.3em",
      paddingRight: "0.5em",
      alignSelf: "start",
      textAlign: "end",
      overflowWrap: "anywhere",
    },
    control: {
      alignSelf: "center",
    },
  },
  variants: {
    stacked: {
      true: {
        label: {
          padding: "0",
          alignSelf: "auto",
          textAlign: "start",
        },
        control: {
          alignSelf: "auto",
        },
      },
      false: {},
    },
  },
  defaultVariants: {
    stacked: false,
  },
});
