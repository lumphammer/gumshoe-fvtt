import type {
  ElementState,
  StateLayer,
  ThemeStyle,
} from "@lumphammer/investigator-fvtt-types";

import { badgeStates } from "./badge";
import { buttonStates } from "./button";
import { checkboxStates } from "./checkbox";
import { inputStates } from "./input";
import { logoStates } from "./logo";
import { rowStates } from "./lists";
import { selectStates } from "./select";
import { tabsStates } from "./tabs";
import { toggleStates } from "./toggle";

/** A state's default: a style, or a style for each slot of a slot recipe. */
export type StateDefault = ThemeStyle | Record<string, ThemeStyle>;

/**
 * Each recipe's element states (stateLayers.ts), by recipe name, with their
 * defaults: a recipe has the states it has a default for, and a theme can
 * style only those. They're written next to each recipe, in plain CSS terms
 * (palette entries as `var(--inv-…)`), not Panda's, as they aren't Panda's:
 * `pnpm generate:catalogue` writes them as CSS (elementStates.generated.css),
 * in each state's layer, and the recipes' shapes and the docs' table from
 * them.
 *
 * A recipe can have its own default for a state layer too (the logo's hover
 * feedback), over the layer's default for everything (states.css): a theme
 * can style the state layers on any recipe's elements anyway, so it's only
 * CSS, not part of the recipe's shape.
 */
export const elementStateDefaults: Record<
  string,
  Partial<Record<ElementState | StateLayer, StateDefault>>
> = {
  badge: badgeStates,
  button: buttonStates,
  checkbox: checkboxStates,
  input: inputStates,
  logo: logoStates,
  row: rowStates,
  select: selectStates,
  tabs: tabsStates,
  toggle: toggleStates,
};
