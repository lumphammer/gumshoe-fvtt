import { defineSlotRecipe } from "@pandacss/dev";

/**
 * **poolPips**: a pool drawn as a row of pips, one per point of its rating:
 * filled for the points left, hollow for the points spent. Beside the number,
 * so a pool can be read at a glance down a list.
 *
 * Use for: an ability's pool in its row on a character sheet.
 * Not for: picking a value (the pool trackers' pips are buttons: `button`'s
 * `pip` kind).
 *
 * Slots: `root` (the row of pips) and `pip`. Variant `point` (on `pip`):
 * `left`, a point that's left, filled; `spent`, an outline; `none`, the one
 * pip of a rating of 0, an outline struck through like an empty set (∅), the
 * stroke running past the circle. All in `text`.
 */
export const poolPips = defineSlotRecipe({
  className: "inv-pool-pips",
  description: "A pool drawn as a row of pips: filled for points left.",
  slots: ["root", "pip"],
  base: {
    root: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.2em",
    },
    pip: {
      display: "inline-block",
      width: "0.5em",
      height: "0.5em",
      borderRadius: "50%",
      borderWidth: "1px",
      borderStyle: "solid",
    },
  },
  variants: {
    point: {
      left: { pip: { background: "text", borderColor: "text" } },
      spent: { pip: { background: "transparent", borderColor: "text" } },
      none: {
        pip: {
          position: "relative",
          background: "transparent",
          borderColor: "text",
          // the stroke: bottom left to top right, a little past the circle
          "&::after": {
            content: "''",
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "0.85em",
            height: "1px",
            background: "text",
            transform: "translate(-50%, -50%) rotate(-45deg)",
          },
        },
      },
    },
  },
  defaultVariants: { point: "spent" },
});
