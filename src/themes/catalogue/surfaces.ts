import { defineRecipe } from "@pandacss/dev";

import { paletteVar } from "../palette";

const v = (key: Parameters<typeof paletteVar>[0]) => `var(${paletteVar(key)})`;

/** A colour with half of `danger` mixed in. */
const dangerous = (color: string) =>
  `[color-mix(in srgb, ${v("danger")} 50%, ${color})]` as const;

/**
 * **surface**: a plain area of surface that isn't a block of content of its
 * own (a panel has padding and nests; this doesn't): a sheet's notes area, a
 * cover over an image, a loading screen.
 *
 * Variants: `depth` (`top` is `surface`, `nested` is `surfaceNested`), and
 * `solid`, for one that overlaps or scrolls over other content, which uses
 * the solid version.
 * Not for: a block of content (panel); something raised above the sheet
 * (floating).
 */
export const surface = defineRecipe({
  className: "inv-surface",
  description: "A plain area of surface.",
  base: {},
  variants: {
    depth: { top: {}, nested: {} },
    solid: { true: {}, false: {} },
  },
  compoundVariants: [
    { depth: "top", solid: false, css: { background: "surface" } },
    { depth: "nested", solid: false, css: { background: "surfaceNested" } },
    { depth: "top", solid: true, css: { background: "surfaceSolid" } },
    {
      depth: "nested",
      solid: true,
      css: { background: "surfaceNestedSolid" },
    },
  ],
  defaultVariants: { depth: "top", solid: false },
});

/**
 * **floating**: something raised above the sheet, overlapping it: always on
 * a solid surface.
 *
 * Variants: `kind`:
 * - `overlay`: a message over everything (the party sheet's "drop actors
 *   here"): rounded, with `elevation`.
 * - `drawer`: a panel sliding in from the side (nested settings pages), with
 *   a `line` on its leading edge.
 * - `bar`: a bar stuck to the top of a scrolling area (build points), with a
 *   `line` under it.
 * - `chip`: a small label over a picture (the image picker's link), which
 *   lightens under the pointer.
 */
export const floating = defineRecipe({
  className: "inv-floating",
  description: "Something raised above the sheet, overlapping it.",
  base: { background: "surfaceSolid" },
  variants: {
    kind: {
      overlay: { borderRadius: "0.5em", boxShadow: "elevation" },
      drawer: {
        borderLeftWidth: "1px",
        borderLeftStyle: "solid",
        borderLeftColor: "line",
      },
      bar: {
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "line",
        backdropFilter: "blur(10px)",
      },
      chip: {
        borderRadius: "0.5em",
        transition: "background-color 0.2s",
        _hover: { background: "surface" },
      },
    },
  },
  defaultVariants: { kind: "overlay" },
});

/**
 * **partyCell**: a cell of the party sheet's grid of abilities (specialised).
 * Rows alternate between `surface` and `surfaceNested`; an ability nobody in
 * the party has is tinted with `danger`. Header cells (the actors' names, the
 * abilities' names) are stuck over the others as it scrolls, so they're on
 * the solid surfaces.
 *
 * Variants: `odd`, `zero` (nobody has it), `header`.
 */
export const partyCell = defineRecipe({
  className: "inv-party-cell",
  description: "A cell of the party sheet's grid of abilities.",
  base: {},
  variants: {
    odd: { true: {}, false: {} },
    zero: { true: {}, false: {} },
    header: { true: {}, false: {} },
  },
  compoundVariants: [
    { odd: true, zero: false, header: false, css: { background: "surface" } },
    {
      odd: false,
      zero: false,
      header: false,
      css: { background: "surfaceNested" },
    },
    {
      odd: true,
      zero: false,
      header: true,
      css: { background: "surfaceSolid" },
    },
    {
      odd: false,
      zero: false,
      header: true,
      css: { background: "surfaceNestedSolid" },
    },
    {
      odd: true,
      zero: true,
      header: false,
      css: { background: dangerous(v("surface")) },
    },
    {
      odd: false,
      zero: true,
      header: false,
      css: { background: dangerous(v("surfaceNested")) },
    },
    {
      odd: true,
      zero: true,
      header: true,
      css: { background: dangerous(v("surfaceSolid")) },
    },
    {
      odd: false,
      zero: true,
      header: true,
      css: { background: dangerous(v("surfaceNestedSolid")) },
    },
  ],
  defaultVariants: { odd: false, zero: false, header: false },
});
