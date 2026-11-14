import type { StateLayer } from "@lumphammer/investigator-fvtt-types";

/**
 * The state layers (`states.css`, docs/theming.md "State layers"): the
 * cascade layer each one is in, and the selectors for an element in that
 * state (nothing, for anything, or a class). `states.css` has the defaults,
 * with the same selectors (a test checks), in each layer's `default`
 * sub-layer; a theme's overrides go in its `theme` sub-layer, after it, so
 * they win whatever their specificity.
 */
export const stateLayers: Record<
  StateLayer,
  { layer: string; selectors: (element: string) => string[] }
> = {
  hoverFeedback: {
    layer: "system.states.hover",
    selectors: (element) => [
      `${element}[data-interactive]:not(:disabled, [aria-disabled="true"], [data-disabled]):hover`,
    ],
  },
  dropTarget: {
    layer: "system.states.drop",
    selectors: (element) => [
      `${element}:is([data-drop-state="ready"], [data-drop-state="over"])`,
    ],
  },
  focusRing: {
    layer: "system.states.focus",
    selectors: (element) => [
      `${element}:focus-visible`,
      // a visually hidden input shows focus on what stands for it, after it
      `input:focus-visible + ${element}:is(label, span)`,
    ],
  },
};

export const isStateLayer = (name: string): name is StateLayer =>
  Object.hasOwn(stateLayers, name);
