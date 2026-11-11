import type { StateLayer } from "@lumphammer/investigator-fvtt-types";

/**
 * The state layers (`states.css`, docs/theming.md "State layers"), as a
 * theme's override of one is written: the sub-layer it's in, and its
 * selectors, for a prefix (the theme's root and a space, for the whole
 * theme, or nothing) and an element (nothing, for anything, or a class).
 * `states.css` is written with the same selectors (a test checks), so an
 * override is exactly as specific as the default, and wins by coming later.
 */
export const stateLayers: Record<
  StateLayer,
  { layer: string; selectors: (prefix: string, element: string) => string[] }
> = {
  hoverFeedback: {
    layer: "system.states.hover",
    selectors: (prefix, element) => [
      `${prefix}${element}[data-interactive]:not(:disabled, [aria-disabled="true"], [data-disabled]):hover`,
    ],
  },
  dropTarget: {
    layer: "system.states.drop",
    selectors: (prefix, element) => [
      `${prefix}${element}:is([data-drop-state="ready"], [data-drop-state="over"])`,
    ],
  },
  focusRing: {
    layer: "system.states.focus",
    selectors: (prefix, element) => [
      `${prefix}${element}:focus-visible`,
      `${prefix}input:focus-visible + ${element}:is(label, span)`,
    ],
  },
};

export const isStateLayer = (name: string): name is StateLayer =>
  Object.hasOwn(stateLayers, name);
