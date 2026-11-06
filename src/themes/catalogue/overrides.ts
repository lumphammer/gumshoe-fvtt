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

const kebab = (key: string) =>
  key.startsWith("--")
    ? key
    : key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const cssValue = (key: string, value: string | number) =>
  typeof value === "number" &&
  value !== 0 &&
  !key.startsWith("--") &&
  !unitless.has(key)
    ? `${value}px`
    : String(value);

/**
 * Whether a piece of a theme can go into the stylesheet as it is: nothing
 * that could end the rule it's in, or start a comment that swallows the end.
 */
const isSafe = (text: string) => !/[{};]|\/\*|\*\/|<\//.test(text);

/** Split a selector list on its top-level commas. */
export function splitSelectorList(list: string) {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = "";
  for (const char of list) {
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "(" || char === "[") {
      depth++;
    } else if (char === ")" || char === "]") {
      depth--;
    } else if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  return [...parts, current].map((part) => part.trim());
}

/** `&` stands for the parent; anything else is a descendant. */
const nest = (parents: string[], key: string) =>
  splitSelectorList(key).flatMap((part) =>
    parents.map((parent) =>
      part.includes("&") ? part.replaceAll("&", parent) : `${parent} ${part}`,
    ),
  );

function serialize(
  selectors: string[],
  style: OverrideStyle,
  replace: boolean,
): string[] {
  const declarations = replace ? ["all: revert-layer;"] : [];
  const nested: string[] = [];
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;
    if (!isSafe(key)) {
      console.warn(`Catalogue override: ignoring "${key}"`);
      continue;
    }
    if (typeof value === "object") {
      nested.push(
        ...(key.startsWith("@")
          ? [`${key} { ${serialize(selectors, value, false).join("\n")} }`]
          : serialize(nest(selectors, key), value, false)),
      );
    } else if (isSafe(String(value))) {
      declarations.push(`${kebab(key)}: ${cssValue(key, value)};`);
    } else {
      console.warn(`Catalogue override: ignoring ${key}: ${value}`);
    }
  }
  return [`${selectors.join(", ")} { ${declarations.join(" ")} }`, ...nested];
}

/**
 * The CSS for a theme's overrides, scoped to that theme's roots.
 *
 * Each rule goes in the same cascade layer as the default it replaces, and
 * starts with `all: revert-layer`. Inside that layer, `revert-layer` means "as
 * if this layer had nothing for this element", so the default's declarations
 * are all dropped, and the override's own (later in the same rule) apply.
 *
 * The theme scope is in `:where()`, so an override is exactly as specific as
 * the default, and wins by coming later (it's rendered inside the themed
 * root, after our stylesheet). So the class's state rules, which are more
 * specific (`.inv-badge--...:is([aria-pressed=true])`), still beat it, and so
 * do its other layers, such as its variants.
 */
export function catalogueOverridesCss(
  slug: string,
  overrides: CatalogueOverrides,
) {
  return Object.entries(overrides)
    .filter(([name]) => {
      const ok = /^[a-z0-9_-]+$/.test(name);
      if (!ok) console.warn(`Catalogue override: no such class "${name}"`);
      return ok;
    })
    .map(
      ([name, style]) =>
        `@layer ${layerOf(name)} {\n${serialize(
          [`:where([data-inv-theme="${slug}"]) .inv-${name}`],
          style,
          true,
        ).join("\n")}\n}`,
    )
    .join("\n");
}
