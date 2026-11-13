import type {
  ThemeCatalogue,
  ThemeStyle,
  ThemeV2,
} from "@lumphammer/investigator-fvtt-types";

import { themeSlug } from "../palette";
import { recipeShapes } from "./recipeShapes.generated";
import { isStateLayer, stateLayers } from "./stateLayers";

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

/** A recipe's override, as loosely as a theme from a JSON file has it. */
interface Override {
  base?: Styles;
  variants?: Record<string, Record<string, Styles | undefined> | undefined>;
  compoundVariants?: readonly ({ css?: Styles } & Record<string, unknown>)[];
  states?: Record<string, Styles | undefined>;
}

interface Shape {
  className: string;
  slots: readonly string[];
  variants: Record<string, readonly string[]>;
}

/**
 * A theme's catalogue (by recipe, shaped like the recipes) as rules: each
 * part's selector, and the layer Panda puts that part's default in (see the
 * layers in panda.config.ts), so the theme's rule goes over the default and
 * nothing else. What doesn't fit is left out, with a warning: a name the
 * catalogue doesn't have (a recipe, slot, variant, value or state), or
 * something that isn't a style where one should be. A theme may be built
 * against older types, or be a JSON file (`validateThemeV2` checks only its
 * general shape).
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
    if (style === null || typeof style !== "object" || Array.isArray(style)) {
      warn(`${where}: not a style`);
      return;
    }
    rules.push({ layer, frame, selectors, style: style as ThemeStyle });
  };

  /** A state layer's rule, for an element (a class, or nothing: anything). */
  const addState = (
    where: string,
    state: string,
    element: string,
    style: unknown,
    frame = false,
  ) => {
    if (!isStateLayer(state)) {
      warn(`${where}: no such state "${state}"`);
      return;
    }
    const { layer, selectors } = stateLayers[state];
    add(
      `${where}.${state}`,
      `${layer}.theme`,
      selectors(element),
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
      styles: Styles | undefined,
      where: string,
      to: (style: unknown, where: string, slot?: string) => void,
    ) => {
      if (shape.slots.length === 0) {
        to(styles, where);
        return;
      }
      for (const [slot, style] of Object.entries(styles ?? {})) {
        if (shape.slots.includes(slot)) to(style, `${where}.${slot}`, slot);
        else warn(`${where}: no such slot "${slot}"`);
      }
    };

    for (const part of Object.keys(override)) {
      if (!["base", "variants", "compoundVariants", "states"].includes(part)) {
        warn(
          `${recipeName}: "${part}" isn't base, variants, compoundVariants or states`,
        );
      }
    }

    each(override.base, `${recipeName}.base`, (style, where, slot) =>
      add(where, layer("base"), [element(slot)], style, frame),
    );

    for (const [variant, options] of Object.entries(override.variants ?? {})) {
      for (const [option, styles] of Object.entries(options ?? {})) {
        const where = `${recipeName}.variants.${variant}.${option}`;
        if (!isOption(variant, option)) {
          warn(`${where}: no such variant value`);
          continue;
        }
        each(styles, where, (style, where, slot) =>
          add(
            where,
            layer("variants"),
            [variantClass(variant, option, slot)],
            style,
            frame,
          ),
        );
      }
    }

    (override.compoundVariants ?? []).forEach(({ css, ...conditions }, i) => {
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
      each(css, where, (style, where, slot) => {
        // an element with all of the variants' classes: the first as it is,
        // the others in :where(), so it's as specific as one class, like
        // Panda's own compound classes
        const [first, ...others] = chosen.map(([variant, option]) =>
          variantClass(variant, String(option), slot),
        );
        add(
          where,
          layer("compound_variants"),
          [others.length > 0 ? `${first}:where(${others.join("")})` : first],
          style,
          frame,
        );
      });
    });

    for (const [state, styles] of Object.entries(override.states ?? {})) {
      each(styles, `${recipeName}.states`, (style, _, slot) =>
        addState(`${recipeName}.states`, state, element(slot), style, frame),
      );
    }
  }
  return rules;
}

/**
 * Properties whose numbers have no unit; any other number is pixels, as in
 * React's `style`. (React's own list.)
 */
const unitless = new Set([
  "animationIterationCount",
  "aspectRatio",
  "borderImageOutset",
  "borderImageSlice",
  "borderImageWidth",
  "boxFlex",
  "boxFlexGroup",
  "boxOrdinalGroup",
  "columnCount",
  "columns",
  "flex",
  "flexGrow",
  "flexPositive",
  "flexShrink",
  "flexNegative",
  "flexOrder",
  "gridArea",
  "gridRow",
  "gridRowEnd",
  "gridRowSpan",
  "gridRowStart",
  "gridColumn",
  "gridColumnEnd",
  "gridColumnSpan",
  "gridColumnStart",
  "fontWeight",
  "lineClamp",
  "lineHeight",
  "opacity",
  "order",
  "orphans",
  "scale",
  "tabSize",
  "widows",
  "zIndex",
  "zoom",
  "fillOpacity",
  "floodOpacity",
  "stopOpacity",
  "strokeDasharray",
  "strokeDashoffset",
  "strokeMiterlimit",
  "strokeOpacity",
  "strokeWidth",
]);

const declaration = (key: string, value: string | number) => {
  const custom = key.startsWith("--");
  const property = custom
    ? key
    : key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  const px =
    typeof value === "number" && value !== 0 && !custom && !unitless.has(key);
  return `${property}: ${value}${px ? "px" : ""};`;
};

/**
 * A style's declarations, then its nested rules, written as CSS nesting has
 * them: the browser works out what `&` is. A list of values is fallbacks,
 * one declaration each, so a browser keeps the last it understands.
 */
export function styleCss(style: ThemeStyle): string {
  const declarations: string[] = [];
  const nested: string[] = [];
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      declarations.push(...value.map((each) => declaration(key, each)));
    } else if (typeof value === "object") {
      nested.push(`${key} { ${styleCss(value as ThemeStyle)} }`);
    } else {
      declarations.push(declaration(key, value));
    }
  }
  return [...declarations, ...nested].join(" ");
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
 * default, one declaration at a time. The class's state rules
 * (`:is([aria-pressed=true])` and the like) are more specific, so they
 * still apply over it.
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
