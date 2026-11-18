import type {
  ElementState,
  ThemeStyle,
} from "@lumphammer/investigator-fvtt-types";

import { badgeStates } from "./badge";
import { buttonStates } from "./button";
import { checkboxStates } from "./checkbox";
import { inputStates } from "./input";
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
 */
export const elementStateDefaults: Record<
  string,
  Partial<Record<ElementState, StateDefault>>
> = {
  badge: badgeStates,
  button: buttonStates,
  checkbox: checkboxStates,
  input: inputStates,
  row: rowStates,
  select: selectStates,
  tabs: tabsStates,
  toggle: toggleStates,
};
