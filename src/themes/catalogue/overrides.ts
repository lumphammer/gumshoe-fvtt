import type { CSSProperties } from "react";

import { isStateLayer, stateLayers } from "./stateLayers";

/**
 * Styles for a catalogue override: CSS properties in camel case, plus nested
 * rules keyed by a selector (`&:hover`, `& > img`) or an at-rule (`@media
 * ...`).
 */
export type OverrideStyle = CSSProperties & {
  [key: string]:
    | OverrideStyle
    | string
    | number
    | (string | number)[]
    | undefined;
};

/**
 * A theme's replacements for catalogue classes, keyed by the class's name
 * without the `inv-` prefix: `badge`, `badge--tone_danger`,
 * `badge--compound__tone_danger__weight_strong`, `card__title`.
 *
 * An override of a base or slot **replaces** the default rule for that name:
 * none of the default's declarations survive, but the class's other parts
 * (its variants, other slots, states) still apply. An override of a variant
 * or compound variant **patches** it: its declarations go over the
 * variant's. See docs/theming.md.
 *
 * Internal for now: not part of the published theme types.
 */
export type CatalogueOverrides = Record<string, OverrideStyle>;

/**
 * The cascade layer Panda puts a part of a recipe in (see the layers in
 * panda.config.ts): a slot's parts under `slots`, then `base`, `variants` or
 * `compound_variants`. A name can also be several variants' classes joined
 * by `.` (`badge--tone_danger.badge--weight_strong`): an element with all of
 * them, in the compound variants' layer (a variant joined to itself is that
 * variant, in that layer).
 */
export function layerOf(name: string) {
  const [part, ...variant] = name.split("--");
  const slots = part.includes("__") ? ".slots" : "";
  const sub =
    variant.length === 0
      ? "base"
      : variant[0].startsWith("compound__") || name.includes(".")
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
 * Whether a key (a property name or a selector) can go into the stylesheet as
 * it is: nothing that could end the rule it's in, or start a comment that
 * swallows the end.
 */
const isSafe = (text: string) => !/[{};]|\/\*|\*\/|<\//.test(text);

/**
 * A value with every `<` inside a quoted string escaped (`\\3c `, which CSS
 * reads as `<`), so an inline SVG in a data URL (`url("data:image/svg+xml,
 * <svg>...</svg>")`) can't end the `<style>` it's in.
 */
export function escapeStrings(text: string) {
  let quote: string | null = null;
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quote) {
      if (char === "\\") {
        out += char + (text[i + 1] ?? "");
        i++;
        continue;
      }
      if (char === quote) {
        quote = null;
      } else if (char === "<") {
        out += "\\3c ";
        continue;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
    }
    out += char;
  }
  return out;
}

/**
 * Whether a value can go into the stylesheet as it is. Like `isSafe`, but `;`,
 * braces and comment markers are allowed inside a quoted string or a
 * `url(...)`, where they can't end anything: a data URL backdrop
 * (`url("data:image/svg+xml;base64,...")`) is fine. Strings must close on
 * their line, `url(` must close, a backslash is allowed only in a quoted
 * string, and `</` (which would end the `<style>`) is never allowed.
 */
export function isSafeValue(text: string) {
  if (text.includes("</")) return false;
  let quote: string | null = null;
  let inUrl = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inUrl) {
      // CSS reads a quote, "(" or escape in an unquoted url as a bad url,
      // which can end anywhere: refuse them
      if (char === ")") inUrl = false;
      else if (/["'(\\]/.test(char)) return false;
    } else if (quote) {
      if (char === "\\") i++;
      // CSS ends a string at any newline
      else if (/[\n\r\f]/.test(char)) return false;
      else if (char === quote) quote = null;
    } else if (char === "\\") {
      // an escape outside a string can disguise anything (`\\75rl(` is
      // `url(`), and a theme's value has no need of one
      return false;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (
      /(?:^|[^\w-])url\($/i.test(text.slice(Math.max(0, i - 4), i + 1))
    ) {
      // an unquoted url(...) runs to its ")"; a quoted one is a string
      inUrl = !/^[ \t\n\r\f]*["']/.test(text.slice(i + 1));
    } else if (/[{};]/.test(char) || text.startsWith("/*", i)) {
      return false;
    } else if (text.startsWith("*/", i)) {
      return false;
    }
  }
  return quote === null && !inUrl;
}

/** Split a selector list on its top-level commas. */
export function splitSelectorList(list: string) {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = "";
  for (let i = 0; i < list.length; i++) {
    const char = list[i];
    if (char === "\\") {
      // an escaped character, in a string or not, is just a character
      current += char + (list[i + 1] ?? "");
      i++;
      continue;
    }
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

/** `&` stands for the parent (not an escaped one, or one in a string). */
const replaceParent = (part: string, parent: string) =>
  part.replace(/\\.|(["'])(?:\\.|(?!\1)[^\\])*\1|&/g, (match) =>
    match === "&" ? parent : match,
  );

/** `&` stands for the parent; anything else is a descendant. */
const nest = (parents: string[], key: string) =>
  splitSelectorList(key).flatMap((part) =>
    parents.map((parent) =>
      replaceParent(part, "") !== part
        ? replaceParent(part, parent)
        : `${parent} ${part}`,
    ),
  );

/** Whether a selector has `&` (not escaped, nor in a string) in it. */
export const hasParent = (selector: string) =>
  replaceParent(selector, "") !== selector;

/** CSS2's pseudo-elements, which take one colon (`:before`). */
const legacyPseudoElement =
  /^:(?:before|after|first-line|first-letter)(?![\w-])/i;

/**
 * `selector` with `filter` (a zero-specificity condition: `notInOtherTheme`)
 * on its subject, the last compound: before any pseudo-element there
 * (`::before`, or CSS2's `:before`), which nothing can follow, or at the end.
 */
export function onSubject(selector: string, filter: string) {
  const text = selector.trimEnd();
  if (!filter) return text;
  /** Each top-level position from `start`, outside brackets and strings. */
  const topLevel = function* (start: number) {
    let depth = 0;
    let quote: string | null = null;
    for (let i = start; i < text.length; i++) {
      const char = text[i];
      if (char === "\\") {
        i++;
      } else if (quote) {
        if (char === quote) quote = null;
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === "(" || char === "[") {
        depth++;
      } else if (char === ")" || char === "]") {
        depth--;
      } else if (depth === 0) {
        yield i;
      }
    }
  };
  // the subject starts after the last combinator
  let subject = 0;
  for (const i of topLevel(0)) {
    if (/[\s>+~]/.test(text[i])) subject = i + 1;
  }
  for (const i of topLevel(subject)) {
    if (
      text[i] === ":" &&
      (text[i + 1] === ":" || legacyPseudoElement.test(text.slice(i)))
    ) {
      return `${text.slice(0, i)}${filter}${text.slice(i)}`;
    }
  }
  return `${text}${filter}`;
}

function serialize(
  selectors: string[],
  style: OverrideStyle,
  replace: boolean,
  /** On each nested rule's subject: the theme's boundary (`onSubject`). */
  subject = "",
): string[] {
  const declarations = replace ? ["all: revert-layer;"] : [];
  const nested: string[] = [];
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;
    if (!isSafe(key)) {
      console.warn(`Catalogue override: ignoring "${key}"`);
      continue;
    }
    if (Array.isArray(value)) {
      // fallbacks: each in turn, so a browser keeps the last it understands
      for (const each of value) {
        const text = escapeStrings(cssValue(key, each));
        if (isSafeValue(text)) {
          declarations.push(`${kebab(key)}: ${text};`);
        } else {
          console.warn(`Catalogue override: ignoring ${key}: ${each}`);
        }
      }
    } else if (typeof value === "object") {
      nested.push(
        ...(key.startsWith("@")
          ? [
              `${key} { ${serialize(selectors, value, false, subject).join("\n")} }`,
            ]
          : serialize(
              // what a nested rule styles stops at another theme too
              nest(selectors, key).map((nested) => onSubject(nested, subject)),
              value,
              false,
              subject,
            )),
      );
    } else if (isSafeValue(escapeStrings(cssValue(key, value)))) {
      declarations.push(
        `${kebab(key)}: ${escapeStrings(cssValue(key, value))};`,
      );
    } else {
      console.warn(`Catalogue override: ignoring ${key}: ${value}`);
    }
  }
  return [`${selectors.join(", ")} { ${declarations.join(" ")} }`, ...nested];
}

/**
 * The CSS for a theme's overrides, scoped to that theme's roots.
 *
 * Each rule goes in the same cascade layer as the default it replaces. An
 * override of a base or slot starts with `all: revert-layer`: inside that
 * layer, that means "as if this layer had nothing for this element", so the
 * default's declarations are all dropped, and the override's own (later in
 * the same rule) apply. An override of a variant or compound variant doesn't
 * revert: all of a class's variants share one layer, so reverting it would
 * drop the element's other variants too (a row that's both `interactive` and
 * `divided`). A variant override patches, then: its declarations go over the
 * variant's.
 *
 * The theme scope is on the class itself (`.inv-badge:where(<root>, <root>
 * *)`), so a nested rule can put context on either side of it, inside the
 * themed root or outside (`input:checked + &`, `.compact &`). It's in
 * `:where()`, so an override is exactly as specific as the default, and wins
 * by coming later (it's rendered inside the themed root, after our
 * stylesheet). So the class's state rules, which are more specific
 * (`.inv-badge--...:is([aria-pressed=true])`), still beat it, and so do its
 * other layers, such as its variants.
 *
 * A state layer's override (`:hoverFeedback`, the whole theme's, or
 * `tabs__tab:hoverFeedback`, a class's: `compileCatalogue`) goes in that
 * layer's sub-layer, with its selectors (`stateLayers`), and patches it:
 * the theme's as specific as the default, the class's as specific too, and
 * each later than the one before, so a class's wins over the theme's, which
 * wins over the default. The layers after it still win (focus).
 */
/**
 * Not in another theme's root inside this theme's (`scope`), nor that root
 * itself: a theme's rules stop where another theme takes over (a theme
 * farm's specimens, inside a themed window), rather than reaching into it
 * (its `<style>` comes after the roots inside it, so it would win). In
 * `:where()`, so it adds nothing to a rule's specificity.
 *
 * CSS can't say "the nearest themed root is this theme's", so a root of
 * this theme inside another theme's, inside this one's, is cut off too:
 * nothing nests themes like that.
 */
export const notInOtherTheme = (scope: string) => {
  const other = `${scope} [data-inv-theme]:not(${scope})`;
  return `:where(:not(${other}, ${other} *))`;
};

export function catalogueOverridesCss(
  slug: string,
  overrides: CatalogueOverrides,
) {
  const parsed = Object.entries(overrides).flatMap(([name, style]) => {
    const match = /^([a-z0-9_-]+(?:\.[a-z0-9_-]+)*)?(?::([A-Za-z]+))?$/.exec(
      name,
    );
    // either group can be missing
    const [, className, stateName]: (string | undefined)[] = match ?? [];
    const state =
      stateName !== undefined && isStateLayer(stateName) ? stateName : null;
    if (
      !match ||
      (className === undefined && stateName === undefined) ||
      (stateName !== undefined && state === null)
    ) {
      console.warn(`Catalogue override: no such class "${name}"`);
      return [];
    }
    return [{ className, state, style }];
  });
  // a state layer's overrides after the rest, the theme's own before a
  // class's: in the same sub-layer, as specific, the later wins
  const order = ({ className, state }: (typeof parsed)[number]) =>
    state === null ? 0 : className === undefined ? 1 : 2;
  return parsed
    .sort((a, b) => order(a) - order(b))
    .map(({ className, state, style }) => {
      // the window around a root is Foundry's, and has its own attribute
      const attribute = className?.startsWith("app-frame")
        ? "data-inv-frame"
        : "data-inv-theme";
      const scope = `[${attribute}="${slug}"]`;
      // a window's frame has no theme inside it to stop at
      const own = attribute === "data-inv-theme" ? notInOtherTheme(scope) : "";
      if (className === undefined) {
        // a state layer, everywhere in the theme: as the default is written
        // (a name without a class has a state: see above)
        if (state === null) return "";
        const { layer, selectors } = stateLayers[state];
        return `@layer ${layer} {\n${serialize(
          selectors(`${scope} `, own),
          style,
          false,
          own,
        ).join("\n")}\n}`;
      }
      // a compound: the first class as it is, the others in :where(), so
      // it's as specific as Panda's compound class, and the class's states
      // still win
      const [first, ...others] = className.split(".");
      const classes = `.inv-${first}${
        others.length > 0
          ? `:where(${others.map((part) => `.inv-${part}`).join("")})`
          : ""
      }:where(${scope}, ${scope} *)${own}`;
      if (state !== null) {
        // a state layer, on this class: patched, as the layers are
        const { layer, selectors } = stateLayers[state];
        return `@layer ${layer} {\n${serialize(
          selectors("", classes),
          style,
          false,
          own,
        ).join("\n")}\n}`;
      }
      return `@layer ${layerOf(className)} {\n${serialize(
        [classes],
        style,
        // a base or slot is replaced; a variant is patched (see above)
        layerOf(className).endsWith(".base"),
        own,
      ).join("\n")}\n}`;
    })
    .join("\n");
}
