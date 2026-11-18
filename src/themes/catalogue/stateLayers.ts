import type {
  ElementState,
  StateLayer,
} from "@lumphammer/investigator-fvtt-types";

/** Where a state's rules go, and what an element in that state is. */
export interface StateDefinition {
  /** The cascade layer its defaults are in. */
  defaultLayer: string;
  /** The cascade layer a theme's changes to it go in. */
  themeLayer: string;
  /** The selectors for an element (a class, or nothing: anything) in it. */
  selectors: (element: string) => string[];
}

/**
 * A state layer's layers: its defaults in its `default` sub-layer, and a
 * theme's changes in its `theme` sub-layer, after it, so they win whatever
 * their specificity (a theme's own, everywhere, are less specific than a
 * default's `[data-inv-theme] …`).
 */
const feedbackLayers = (layer: string) => ({
  defaultLayer: `${layer}.default`,
  themeLayer: `${layer}.theme`,
});

/**
 * An element state's layer: its defaults and a theme's changes to them are
 * in the same one, as a recipe's are, so a theme's patches the default (it's
 * scoped, and as specific, or more), and `all: "revert-layer"` in it drops
 * the default, back to the element's own look.
 */
const elementLayers = (layer: string) => ({
  defaultLayer: layer,
  themeLayer: layer,
});

/**
 * The state layers (`states.css`, docs/theming.md "States"): feedback that
 * looks the same on anything, whatever its class. `states.css` has the
 * defaults, with the same selectors (a test checks).
 */
export const stateLayers: Record<StateLayer, StateDefinition> = {
  hoverFeedback: {
    ...feedbackLayers("system.states.hover"),
    selectors: (element) => [
      `${element}[data-interactive]:not(:disabled, [aria-disabled="true"], [data-disabled]):hover`,
    ],
  },
  dropTarget: {
    ...feedbackLayers("system.states.drop"),
    selectors: (element) => [
      `${element}:is([data-drop-state="ready"], [data-drop-state="over"])`,
    ],
  },
  focusRing: {
    ...feedbackLayers("system.states.focus"),
    selectors: (element) => [
      `${element}:focus-visible`,
      // a visually hidden input shows focus on what stands for it, after it
      `input:focus-visible + ${element}:is(label, span)`,
    ],
  },
};

/**
 * What a visually hidden input's state shows on: the label or span that
 * stands for it, after it (a tab, a CheckButtons label, a checkbox's box),
 * and what's in that (a checkbox's tick). Only a label or span, as for
 * `focusRing`, so a button that merely follows a disabled input isn't
 * disabled.
 */
const standIns = (pseudo: string, element: string) => [
  `input${pseudo} + ${element}:is(label, span)`,
  `input${pseudo} + :is(label, span) > ${element}`,
];

/**
 * The element states (docs/theming.md "States"): what an element is, rather
 * than feedback on it. Each recipe has the ones it styles
 * (`elementStateDefaults.ts`, which generates their defaults' CSS and the
 * recipes' types), and a theme can style only those, for a recipe's
 * elements, never everywhere. They come after the recipes, and before the
 * state layers, in this order, so a later one wins: a disabled button that's
 * pressed looks disabled, and focus still shows on anything.
 */
export const elementStates: Record<ElementState, StateDefinition> = {
  // the current one of several: a tab, the page you're on
  selected: {
    ...elementLayers("system.states.selected"),
    selectors: (element) => [
      `${element}:is([aria-current="page"], [aria-current="true"], [aria-selected="true"], [data-selected])`,
    ],
  },
  // on: a switch (Radix's `data-state`), a checkbox
  checked: {
    ...elementLayers("system.states.checked"),
    selectors: (element) => [
      `${element}:is(:checked, [data-state="checked"])`,
      ...standIns(":checked", element),
    ],
  },
  // a toggle button that's down, or a label standing for a checked radio
  pressed: {
    ...elementLayers("system.states.pressed"),
    selectors: (element) => [
      `${element}:is([aria-pressed="true"], [data-pressed])`,
    ],
  },
  invalid: {
    ...elementLayers("system.states.invalid"),
    selectors: (element) => [`${element}[aria-invalid="true"]`],
  },
  disabled: {
    ...elementLayers("system.states.disabled"),
    selectors: (element) => [
      `${element}:is(:disabled, [disabled], [aria-disabled="true"], [data-disabled])`,
      ...standIns(":disabled", element),
    ],
  },
};

export const isStateLayer = (name: string): name is StateLayer =>
  Object.hasOwn(stateLayers, name);

export const isElementState = (name: string): name is ElementState =>
  Object.hasOwn(elementStates, name);

/**
 * What a style's nested selector (in a theme's `base`, `variants` or
 * compound variant, or in a recipe) looks like when it's an element state,
 * which belongs in `states` instead: the attributes and pseudo-classes in
 * that state's selectors, and Panda's condition for it.
 */
export const elementStateTells: Record<ElementState, RegExp> = {
  selected: /\[(aria-current|aria-selected|data-selected)\b|^_selected$/,
  checked: /:checked\b|\[data-state=["']?checked|^_checked$/,
  pressed: /\[(aria-pressed|data-pressed)\b|^_pressed$/,
  invalid: /\[aria-invalid\b|:invalid\b|^_invalid$/,
  disabled:
    /:disabled\b|\[(disabled|aria-disabled|data-disabled)\b|^_disabled$/,
};
