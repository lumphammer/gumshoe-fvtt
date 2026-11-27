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
 * Slots: `root` (the row of pips) and `pip`. Variant `filled` (on `pip`): a
 * point that's left, in `text`; one that's spent is an outline in `line`.
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
    filled: {
      true: { pip: { background: "text", borderColor: "text" } },
      false: { pip: { background: "transparent", borderColor: "line" } },
    },
  },
  defaultVariants: { filled: false },
});
