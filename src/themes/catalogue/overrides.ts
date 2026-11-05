import type { CSSProperties } from "react";

/**
 * Styles for a catalogue override: CSS properties in camel case, plus nested
 * rules keyed by a selector (`&:hover`, `& > img`) or an at-rule (`@media
 * ...`).
 */
export type OverrideStyle = CSSProperties & {
  [key: string]: OverrideStyle | string | number | undefined;
};

/**
 * A theme's replacements for catalogue classes, keyed by the class's name
 * without the `inv-` prefix: `badge`, `badge--tone_danger`,
 * `badge--compound__tone_danger__weight_strong`, `card__title`.
 *
 * Each one **replaces** the default rule for that name: none of the default's
 * declarations survive, but the class's other parts (its variants, other
 * slots, states) still apply. See docs/theming.md.
 *
 * Internal for now: not part of the published theme types.
 */
export type CatalogueOverrides = Record<string, OverrideStyle>;

/**
 * The cascade layer Panda puts a part of a recipe in (see the layers in
 * panda.config.ts): a slot's parts under `slots`, then `base`, `variants` or
 * `compound_variants`.
 */
export function layerOf(name: string) {
  const [part, ...variant] = name.split("--");
  const slots = part.includes("__") ? ".slots" : "";
  const sub =
    variant.length === 0
      ? "base"
      : variant[0].startsWith("compound__")
        ? "compound_variants"
        : "variants";
  return `system.recipes${slots}.${sub}`;
}

const unitless = new Set([
  "zIndex",
  "opacity",
  "lineHeight",
  "flex",
  "flexGrow",
  "flexShrink",
  "fontWeight",
  "order",
]);

const kebab = (key: string) =>
  key.startsWith("--")
    ? key
    : key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const cssValue = (key: string, value: string | number) =>
  typeof value === "number" && value !== 0 && !unitless.has(key)
    ? `${value}px`
    : String(value);

/** `&` stands for the parent; anything else is a descendant. */
const nest = (parent: string, key: string) =>
  key
    .split(",")
    .map((part) => part.trim())
    .map((part) =>
      part.includes("&") ? part.replaceAll("&", parent) : `${parent} ${part}`,
    )
    .join(", ");

function serialize(selector: string, style: OverrideStyle, replace: boolean) {
  const declarations = replace ? ["all: revert-layer;"] : [];
  const nested: string[] = [];
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "object") {
      nested.push(
        key.startsWith("@")
          ? `${key} { ${serialize(selector, value, false)} }`
          : serialize(nest(selector, key), value, false),
      );
    } else {
      declarations.push(`${kebab(key)}: ${cssValue(key, value)};`);
    }
  }
  return [`${selector} { ${declarations.join(" ")} }`, ...nested].join("\n");
}

/**
 * The CSS for a theme's overrides, scoped to that theme's roots.
 *
 * Each rule goes in the same cascade layer as the default it replaces, with a
 * higher specificity, and starts with `all: revert-layer`. Inside that layer,
 * `revert-layer` means "as if this layer had nothing for this element", so the
 * default's declarations are all dropped, and the override's own (later in the
 * same rule) apply. Other layers, such as the class's variants, are
 * untouched.
 */
export function catalogueOverridesCss(
  slug: string,
  overrides: CatalogueOverrides,
) {
  return Object.entries(overrides)
    .map(
      ([name, style]) =>
        `@layer ${layerOf(name)} {\n${serialize(
          `[data-inv-theme="${slug}"] .inv-${name}`,
          style,
          true,
        )}\n}`,
    )
    .join("\n");
}
