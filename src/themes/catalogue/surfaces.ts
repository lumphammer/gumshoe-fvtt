import { defineRecipe } from "@pandacss/dev";

import { paletteVar } from "../palette";

/** A surface tinted halfway to `danger`: an area that's in trouble. */
const dangerTint = (surface: "surface" | "surfaceNested") =>
  `[color-mix(in srgb, var(${paletteVar("danger")}) 50%, var(${paletteVar(surface)}))]` as const;

/**
 * **surface**: a plain area of surface that isn't a block of content of its
 * own (a panel has padding and nests; this doesn't): a sheet's notes area, a
 * cover over an image, a loading screen.
 *
 * Variants: `depth` (`top` is `surface`, `nested` is `surfaceNested`), and
 * `solid`, for one that overlaps or scrolls over other content. Surfaces are
 * expected to be opaque, so it looks the same; it's there for a theme whose
 * surfaces are translucent, to keep these ones opaque (as V1's do).
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
    // the colour only: a surface can go on an element with a background
    // image of its own (the loading screen's sheet root)
    { depth: "top", solid: false, css: { backgroundColor: "surface" } },
    {
      depth: "nested",
      solid: false,
      css: { backgroundColor: "surfaceNested" },
    },
    { depth: "top", solid: true, css: { backgroundColor: "surface" } },
    {
      depth: "nested",
      solid: true,
      css: { backgroundColor: "surfaceNested" },
    },
  ],
  defaultVariants: { depth: "top", solid: false },
});

/**
 * **floating**: something raised above the sheet, overlapping it, on
 * `surface`. (A V1 theme's override replaces this base with its opaque
 * surface: keep the base to the background.)
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
  base: { background: "surface" },
  variants: {
    kind: {
      overlay: { borderRadius: "0.5em", boxShadow: "elevation" },
      drawer: {
        borderLeftWidth: "1px",
        borderLeftStyle: "solid",
        borderLeftColor: "line",
        // a shadow as deep as the gap it slides in from: the call site sets
        // --drawer-shadow-size
        boxShadow: "[0 0 var(--drawer-shadow-size, 1em) 0 #0007]",
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
 * the party has is on them tinted halfway to `danger`.
 *
 * Variants: `odd`, `zero` (nobody has it), `header`: the actors' names and
 * the abilities' names, stuck over the other cells as the grid scrolls. They
 * look the same as the others, as surfaces are expected to be opaque; the
 * variant is there for a theme whose surfaces are translucent, to keep the
 * headers opaque (as V1's do).
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
      css: { background: "surface" },
    },
    {
      odd: false,
      zero: false,
      header: true,
      css: { background: "surfaceNested" },
    },
    {
      odd: true,
      zero: true,
      header: false,
      css: { background: dangerTint("surface") },
    },
    {
      odd: false,
      zero: true,
      header: false,
      css: { background: dangerTint("surfaceNested") },
    },
    {
      odd: true,
      zero: true,
      header: true,
      css: { background: dangerTint("surface") },
    },
    {
      odd: false,
      zero: true,
      header: true,
      css: { background: dangerTint("surfaceNested") },
    },
  ],
  defaultVariants: { odd: false, zero: false, header: false },
});
