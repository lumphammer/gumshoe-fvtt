import { defineRecipe } from "@pandacss/dev";

import { paletteVar } from "../palette";

/** A faint wash of the feedback colour, for a row under the pointer. */
const highlight =
  `[color-mix(in srgb, var(${paletteVar("feedback")}) 25%, transparent)]` as const;

/**
 * **sectionHeading**: a heading that divides a sheet into sections ("Academic",
 * "Weapons"), with a `line` rule under it.
 *
 * Use for: the heading of a list or area on a sheet; apply it to the heading
 * itself, or to the row that holds the heading and its buttons.
 * Not for: the column headers of a table (tableHeader).
 */
export const sectionHeading = defineRecipe({
  className: "inv-section-heading",
  description: "A heading that divides a sheet into sections.",
  base: {
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "line",
  },
});

/**
 * **tableHeader**: the row of column headers at the top of a list or table.
 *
 * Use for: "Name", "Ammo", "Ability" over a list of weapons.
 * Not for: a heading for a whole section (sectionHeading).
 */
export const tableHeader = defineRecipe({
  className: "inv-table-header",
  description: "The row of column headers at the top of a list or table.",
  base: {
    fontWeight: "bold",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "line",
  },
});

/**
 * **row**: one item in a list or table.
 *
 * Variants:
 * - `interactive`: the row opens or does something: it's highlighted under
 *   the pointer and when focused from the keyboard, with a wash of
 *   `feedback`, and when it has `data-highlighted` (for a row drawn as
 *   separate cells, which tracks the pointer itself). Rows don't use
 *   `data-interactive`: a glow round a row is too much.
 * - `alternate`: every other row in a long list, on `control`, to help the
 *   eye along it.
 * - `divided`: a `line` under it, for rows with no table around them (a
 *   menu).
 * - `striped`: for rows striped by position, not by the call site (a
 *   settings form, whose rows come and go): the odd ones are on `control`.
 *
 * States: selected (`aria-current`, `aria-selected` or `data-selected`): the
 * row is the current one (the page you're on), on `control`.
 */
export const row = defineRecipe({
  className: "inv-row",
  description: "One item in a list or table.",
  base: {
    "&:is([aria-current=page], [aria-current=true], [aria-selected=true], [data-selected])":
      { background: "control" },
  },
  variants: {
    interactive: {
      true: {
        cursor: "pointer",
        "&:is(:hover, :focus-visible, [data-highlighted])": {
          background: highlight,
        },
      },
      false: {},
    },
    alternate: {
      true: { background: "control" },
      false: {},
    },
    striped: {
      true: { "&:nth-of-type(odd)": { background: "control" } },
      false: {},
    },
    divided: {
      true: {
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "line",
      },
      false: {},
    },
  },
  defaultVariants: {
    interactive: false,
    alternate: false,
    striped: false,
    divided: false,
  },
});

/**
 * **dragHandle**: the grip you drag to reorder a list.
 *
 * Faded until it's under the pointer, when it grows a little and turns
 * `accent`.
 */
export const dragHandle = defineRecipe({
  className: "inv-drag-handle",
  description: "The grip you drag to reorder a list.",
  base: {
    cursor: "n-resize",
    borderRadius: "0.35em",
    color: "textMuted",
    background: "surfaceSolid",
    opacity: 0.7,
    _hover: { opacity: 1, transform: "scale(1.1)", color: "accent" },
  },
});

/**
 * **emptyState**: stands in for a list or area with nothing in it.
 *
 * Not for: warnings or advice (callout).
 */
export const emptyState = defineRecipe({
  className: "inv-empty-state",
  description: "Stands in for a list or area with nothing in it.",
  base: {
    padding: "1.5em 1em",
    borderWidth: "1px",
    borderStyle: "dashed",
    borderColor: "line",
    borderRadius: "0.3em",
    textAlign: "center",
    fontStyle: "italic",
    color: "textMuted",
  },
});
