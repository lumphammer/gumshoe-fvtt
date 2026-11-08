import type { ThemeCatalogue } from "@lumphammer/investigator-fvtt-types";

import { paletteColorKeys, paletteVar } from "../palette";
import type { CatalogueOverrides, OverrideStyle } from "./overrides";
import { recipeShapes } from "./recipeShapes.generated";

type Warn = (message: string) => void;

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const colorNames = new Set<string>(paletteColorKeys);

/** Properties that take a colour, where a palette colour's name is that colour. */
const isColorProperty = (property: string) =>
  /^(color|background|fill|stroke)$|Color$/.test(property);

const isValue = (value: unknown): value is string | number =>
  typeof value === "string" || typeof value === "number";

/** A value, with a palette colour's name, in a colour property, as that colour. */
const compileValue = (property: string, value: string | number) =>
  typeof value === "string" &&
  colorNames.has(value) &&
  isColorProperty(property)
    ? `var(${paletteVar(value as (typeof paletteColorKeys)[number])})`
    : value;

/**
 * A ThemeV2 style as an override style: a palette colour's name as the
 * value of a colour property (or one of its fallbacks) becomes its custom
 * property, and a nested key that's neither a selector with `&` nor an
 * at-rule is dropped (ThemeV2 has no bare descendant selectors). Nothing,
 * for something that isn't a style: an empty style would replace a base
 * with nothing.
 */
function compileStyle(
  style: unknown,
  where: string,
  warn: Warn,
): OverrideStyle | undefined {
  if (!isObject(style)) {
    warn(`${where}: not a style object`);
    return undefined;
  }
  const result: OverrideStyle = {};
  for (const [key, value] of Object.entries(style)) {
    if (key === "__proto__") {
      warn(`${where}: "${key}" isn't a property`);
    } else if (isObject(value)) {
      if (key.startsWith("@") || key.includes("&")) {
        const nested = compileStyle(value, `${where} ${key}`, warn);
        if (nested) result[key] = nested;
      } else {
        warn(`${where}: "${key}" is neither a selector with & nor an at-rule`);
      }
    } else if (isValue(value)) {
      result[key] = compileValue(key, value);
    } else if (Array.isArray(value) && value.every(isValue)) {
      result[key] = value.map((fallback) => compileValue(key, fallback));
    } else if (value !== undefined) {
      warn(`${where}: "${key}" isn't a CSS value`);
    }
  }
  return result;
}

/** `over` on top of `under`, nested rules merged too. */
function merge(under: OverrideStyle | undefined, over: OverrideStyle) {
  const result: OverrideStyle = { ...under };
  for (const [key, value] of Object.entries(over)) {
    const current = result[key];
    result[key] =
      isObject(value) && isObject(current) ? merge(current, value) : value;
  }
  return result;
}

type Shape = (typeof recipeShapes)[keyof typeof recipeShapes];

/**
 * A theme's catalogue (ThemeV2: by recipe, shaped like the recipes) as the
 * overrides `catalogueOverridesCss` renders, by class name. What doesn't fit
 * the catalogue (an unknown recipe, slot, variant or value; a style that
 * isn't one) is left out, with a warning: a theme from a JSON file, or from
 * a module built against older types, can have anything in it.
 */
export function compileCatalogue(
  catalogue: ThemeCatalogue,
  warn: Warn = (message) => console.warn(`Theme catalogue: ${message}`),
): CatalogueOverrides {
  const result: CatalogueOverrides = {};
  // several parts can come to the same class (two compound variants for the
  // same combination): the later ones go over the earlier
  const add = (name: string, style: OverrideStyle | undefined) => {
    if (style) result[name] = merge(result[name], style);
  };
  if (!isObject(catalogue)) {
    warn("not a catalogue");
    return result;
  }

  for (const [recipeName, override] of Object.entries(catalogue)) {
    if (!Object.hasOwn(recipeShapes, recipeName)) {
      warn(`no such recipe "${recipeName}"`);
      continue;
    }
    const shape: Shape = recipeShapes[recipeName as keyof typeof recipeShapes];
    if (!isObject(override)) {
      warn(`${recipeName}: not an override`);
      continue;
    }
    const prefix = shape.className.replace(/^inv-/, "");
    const slots: readonly string[] = shape.slots;
    const variants = shape.variants as Record<string, readonly string[]>;
    const isValueOf = (variant: string, value: string) =>
      Object.hasOwn(variants, variant) && variants[variant].includes(value);

    /**
     * A part's styles (a style, or a style by slot for a slot recipe) as
     * overrides of its classes: `classOf` names the class for a slot, or
     * for the recipe's own element (no slot).
     */
    const addPart = (
      styles: unknown,
      where: string,
      classOf: (slot?: string) => string,
    ) => {
      if (slots.length === 0) {
        add(classOf(), compileStyle(styles, where, warn));
        return;
      }
      if (!isObject(styles)) {
        warn(`${where}: not a style for each slot`);
        return;
      }
      for (const [slot, style] of Object.entries(styles)) {
        if (slots.includes(slot)) {
          add(classOf(slot), compileStyle(style, `${where}.${slot}`, warn));
        } else {
          warn(`${where}: no such slot "${slot}"`);
        }
      }
    };
    const element = (slot?: string) => (slot ? `${prefix}__${slot}` : prefix);
    const variantClass = (variant: string, value: string, slot?: string) =>
      `${element(slot)}--${variant}_${value}`;

    for (const [part, value] of Object.entries(override)) {
      if (part === "base") {
        addPart(value, `${recipeName}.base`, element);
      } else if (part === "variants") {
        if (!isObject(value)) {
          warn(`${recipeName}.variants: not variants`);
          continue;
        }
        for (const [variant, byValue] of Object.entries(value)) {
          if (!Object.hasOwn(variants, variant) || !isObject(byValue)) {
            warn(`${recipeName}: no such variant "${variant}"`);
            continue;
          }
          for (const [variantValue, styles] of Object.entries(byValue)) {
            if (!isValueOf(variant, variantValue)) {
              warn(`${recipeName}.${variant}: no such value "${variantValue}"`);
              continue;
            }
            addPart(
              styles,
              `${recipeName}.${variant}.${variantValue}`,
              (slot) => variantClass(variant, variantValue, slot),
            );
          }
        }
      } else if (part === "compoundVariants") {
        if (!Array.isArray(value)) {
          warn(`${recipeName}.compoundVariants: not a list`);
          continue;
        }
        value.forEach((compound: unknown, i) => {
          const where = `${recipeName}.compoundVariants[${i}]`;
          if (!isObject(compound)) {
            warn(`${where}: not a compound variant`);
            return;
          }
          const { css, ...conditions } = compound;
          // in order, so the same combination is the same class, however
          // it's written
          const chosen = Object.entries(conditions).sort(([a], [b]) =>
            a.localeCompare(b),
          );
          const unknown = chosen.find(
            ([variant, variantValue]) =>
              !(
                (typeof variantValue === "string" ||
                  typeof variantValue === "boolean") &&
                isValueOf(variant, String(variantValue))
              ),
          );
          if (unknown) {
            warn(`${where}: no such variant value for "${unknown[0]}"`);
            return;
          }
          if (chosen.length === 0) {
            warn(`${where}: names no variants`);
            return;
          }
          addPart(css, where, (slot) => {
            const classes = chosen.map(([variant, variantValue]) =>
              variantClass(variant, String(variantValue), slot),
            );
            // classes joined by `.` are a compound (overrides.ts), so one
            // variant on its own is joined to itself
            return (
              classes.length === 1 ? [...classes, ...classes] : classes
            ).join(".");
          });
        });
      } else {
        warn(
          `${recipeName}: "${part}" isn't base, variants or compoundVariants`,
        );
      }
    }
  }
  return result;
}
