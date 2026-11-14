import type {
  ThemeCatalogue,
  ThemeStyle,
  ThemeV2,
} from "@lumphammer/investigator-fvtt-types";

import { themeSlug } from "../palette";
import { recipeShapes } from "./recipeShapes.generated";
import {
  elementStates,
  elementStateTells,
  isElementState,
  isStateLayer,
  type StateDefinition,
  stateLayers,
} from "./stateLayers";
import { styleCss } from "./styleCss";

export { styleCss };

type Warn = (message: string) => void;

/** One rule of a theme's CSS. */
export interface Rule {
  /** The cascade layer: the same one as the default it goes over. */
  layer: string;
  /** On Foundry's window around the themed root (`appFrame`), not in it. */
  frame: boolean;
  selectors: string[];
  style: ThemeStyle;
}

/** A style, or a style for each slot of a slot recipe. */
type Styles = ThemeStyle | Record<string, ThemeStyle>;

/** The states' styles, by state. */
type States = Record<string, Styles | undefined>;

/** A recipe's override, as loosely as a theme from a JSON file has it. */
interface Override {
  base?: Styles;
  variants?: Record<string, Record<string, unknown> | undefined>;
  compoundVariants?: readonly ({ css?: Styles; states?: States } & Record<
    string,
    unknown
  >)[];
  states?: States;
}

interface Shape {
  className: string;
  slots: readonly string[];
  variants: Record<string, readonly string[]>;
  states: readonly string[];
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * A theme's catalogue (by recipe, shaped like the recipes) as rules: each
 * part's selector, and the layer its default is in (Panda's, in
 * panda.config.ts, for a recipe's parts; the state's, for a state), so the
 * theme's rule goes over the default and nothing else. What doesn't fit is
 * left out, with a warning: a name the catalogue doesn't have (a recipe,
 * slot, variant, value or state), or something that isn't a style where one
 * should be. A theme may be built against older types, or be a JSON file
 * (`validateThemeV2` checks only its general shape). A nested selector for an
 * element state the recipe has (`"&[data-pressed]"` in a button's `base`)
 * is kept, with a warning: the state's own default goes over it, so it
 * belongs in `states`.
 */
export function catalogueRules(
  catalogue: ThemeCatalogue,
  warn: Warn = (message) => console.warn(`Theme catalogue: ${message}`),
): Rule[] {
  const rules: Rule[] = [];

  /** Add a rule, if its style is one (a part left undefined is just left out). */
  const add = (
    where: string,
    layer: string,
    selectors: string[],
    style: unknown,
    frame = false,
  ) => {
    if (style === undefined) return;
    if (!isObject(style)) {
      warn(`${where}: not a style`);
      return;
    }
    rules.push({ layer, frame, selectors, style: style as ThemeStyle });
  };

  /**
   * A state's rule, for an element (a class, or nothing: anything): a state
   * layer, or one of the recipe's element states (`shape`, for a recipe).
   */
  const addState = (
    where: string,
    state: string,
    element: string,
    style: unknown,
    frame = false,
    recipe?: { name: string; shape: Shape },
  ) => {
    let definition: StateDefinition | undefined;
    if (isStateLayer(state)) {
      definition = stateLayers[state];
    } else if (isElementState(state) && recipe?.shape.states.includes(state)) {
      definition = elementStates[state];
    } else {
      warn(
        isElementState(state)
          ? `${where}: ${recipe ? `${recipe.name} has` : "a theme's own states have"} no "${state}" state`
          : `${where}: no such state "${state}"`,
      );
      return;
    }
    add(
      `${where}.${state}`,
      definition.themeLayer,
      definition.selectors(element),
      style,
      frame,
    );
  };

  // the theme's own states, everywhere: before any recipe's, which go over
  // them (in the same sub-layer, where the later wins a tie)
  for (const [state, style] of Object.entries(catalogue.states ?? {})) {
    addState("states", state, "", style);
  }

  for (const [recipeName, value] of Object.entries(catalogue)) {
    if (recipeName === "states" || value === undefined) continue;
    if (!Object.hasOwn(recipeShapes, recipeName)) {
      warn(`no such recipe "${recipeName}"`);
      continue;
    }
    const shape: Shape = recipeShapes[recipeName as keyof typeof recipeShapes];
    const recipe = { name: recipeName, shape };
    const override = value as Override;
    const frame = recipeName === "appFrame";
    const layer = (part: string) =>
      `system.recipes${shape.slots.length > 0 ? ".slots" : ""}.${part}`;
    const element = (slot?: string) =>
      `.${shape.className}${slot ? `__${slot}` : ""}`;
    const variantClass = (variant: string, option: string, slot?: string) =>
      `${element(slot)}--${variant}_${option}`;
    const isOption = (variant: string, option: unknown) =>
      Object.hasOwn(shape.variants, variant) &&
      shape.variants[variant].includes(String(option));

    /** Each style in `styles`, with its slot (none, for a plain recipe). */
    const each = (
      styles: unknown,
      where: string,
      to: (style: unknown, where: string, slot?: string) => void,
    ) => {
      if (shape.slots.length === 0) {
        to(styles, where);
        return;
      }
      if (styles !== undefined && !isObject(styles)) {
        warn(`${where}: not a style for each slot`);
        return;
      }
      for (const [slot, style] of Object.entries(styles ?? {})) {
        if (shape.slots.includes(slot)) to(style, `${where}.${slot}`, slot);
        else warn(`${where}: no such slot "${slot}"`);
      }
    };

    /**
     * Warn of a nested selector for one of the recipe's element states in a
     * style: the state's default would go over it.
     */
    const tell = (style: unknown, where: string) => {
      if (!isObject(style)) return;
      for (const [key, nested] of Object.entries(style)) {
        if (!isObject(nested)) continue;
        const state = shape.states.find(
          (state) =>
            isElementState(state) && elementStateTells[state].test(key),
        );
        if (state) {
          warn(
            `${where}: "${key}" is the ${state} state, whose default goes over it: style it in \`states.${state}\`, the recipe's or beside a variant's style`,
          );
        }
        tell(nested, `${where}.${key}`);
      }
    };

    /** A part's rule for each of its styles, after checking them. */
    const addPart = (
      styles: unknown,
      where: string,
      part: string,
      selector: (slot?: string) => string,
    ) =>
      each(styles, where, (style, where, slot) => {
        tell(style, where);
        add(where, layer(part), [selector(slot)], style, frame);
      });

    /** A part's states, on its element (`selector`), after its own. */
    const statesAfter: (() => void)[] = [];
    const addStates = (
      states: unknown,
      where: string,
      selector: (slot?: string) => string,
    ) => {
      if (states === undefined) return;
      if (!isObject(states)) {
        warn(`${where}: not a style for each state`);
        return;
      }
      statesAfter.push(() => {
        for (const [state, styles] of Object.entries(states)) {
          each(styles, `${where}.${state}`, (style, _, slot) =>
            addState(where, state, selector(slot), style, frame, recipe),
          );
        }
      });
    };

    for (const part of Object.keys(override)) {
      if (!["base", "variants", "compoundVariants", "states"].includes(part)) {
        warn(
          `${recipeName}: "${part}" isn't base, variants, compoundVariants or states`,
        );
      }
    }

    // the recipe's own states first: a variant's and a compound variant's
    // are more specific, and go over them
    addStates(override.states, `${recipeName}.states`, element);

    addPart(override.base, `${recipeName}.base`, "base", element);

    for (const [variant, options] of Object.entries(override.variants ?? {})) {
      for (const [option, value] of Object.entries(options ?? {})) {
        const where = `${recipeName}.variants.${variant}.${option}`;
        if (!isOption(variant, option)) {
          warn(`${where}: no such variant value`);
          continue;
        }
        // its style, and its elements' states beside it (a variant can have
        // only states)
        const { states, ...styles } = isObject(value)
          ? value
          : { states: undefined };
        if (!isObject(value) || Object.keys(styles).length > 0) {
          addPart(isObject(value) ? styles : value, where, "variants", (slot) =>
            variantClass(variant, option, slot),
          );
        }
        addStates(
          states,
          `${where}.states`,
          (slot) => `${element(slot)}${variantClass(variant, option, slot)}`,
        );
      }
    }

    (override.compoundVariants ?? []).forEach((compound, i) => {
      const { css, states, ...conditions } = compound;
      const where = `${recipeName}.compoundVariants[${i}]`;
      const chosen = Object.entries(conditions);
      const unknown = chosen.find(([variant, option]) => {
        return !isOption(variant, option);
      });
      if (unknown || chosen.length === 0) {
        warn(
          unknown
            ? `${where}: no such variant value for "${unknown[0]}"`
            : `${where}: names no variants`,
        );
        return;
      }
      // an element with all of the variants' classes: the first as it is,
      // the others in :where(), so it's as specific as one class, like
      // Panda's own compound classes
      const withVariants = (slot?: string) => {
        const [first, ...others] = chosen.map(([variant, option]) =>
          variantClass(variant, String(option), slot),
        );
        return others.length > 0 ? `${first}:where(${others.join("")})` : first;
      };
      addPart(css, where, "compound_variants", withVariants);
      // its states: the recipe's class too, as a variant's are; as specific
      // as a variant's, and after them, so they go over them
      addStates(
        states,
        `${where}.states`,
        (slot) => `${element(slot)}${withVariants(slot)}`,
      );
    });

    for (const states of statesAfter) states();
  }
  return rules;
}

/**
 * A plain selector in an `@scope` never matches the scope's root itself, and
 * some classes are on it (`sheetRoot`, the frame's `root`): so a class is
 * written for the root too. `:where()` keeps it as specific as the class.
 */
const inScope = (selector: string) =>
  selector.startsWith(".")
    ? `:where(:scope)${selector}, ${selector}`
    : selector;

/**
 * Rules as CSS for a `<style>` inside a themed root (`CSSReset`).
 *
 * Each is scoped with `@scope`: to the `<style>`'s parent, the themed root
 * (or, for the window around it, to the element with `data-inv-frame`), and
 * no further than the next themed root inside, so a theme's rules stop where
 * another theme takes over. A scope adds nothing to a selector's
 * specificity, so a theme's rule is exactly as specific as the default, in
 * the same layer, and wins by being scoped (a scoped rule beats an unscoped
 * one that's as specific, wherever each is in the document): it patches the
 * default, one declaration at a time. The states are in layers after the
 * recipes', so they still apply over it.
 */
export function rulesCss(rules: Rule[], slug: string): string {
  return rules
    .map(({ layer, frame, selectors, style }) => {
      const body = styleCss(style);
      if (!body) return "";
      const root = frame ? `([data-inv-frame="${slug}"]) ` : "";
      return `@layer ${layer} { @scope ${root}to (:scope [data-inv-theme]) { ${selectors.map(inScope).join(", ")} { ${body} } } }`;
    })
    .filter(Boolean)
    .join("\n");
}

const cooked = new WeakMap<ThemeV2, string>();

/**
 * A theme's catalogue overrides as CSS (`rulesCss`). Worked out the first
 * time the theme is used, then kept: only the themes a table uses are ever
 * cooked, once each.
 */
export function themeCss(theme: ThemeV2): string {
  let css = cooked.get(theme);
  if (css === undefined) {
    css = rulesCss(catalogueRules(theme.catalogue ?? {}), themeSlug(theme));
    cooked.set(theme, css);
  }
  return css;
}
