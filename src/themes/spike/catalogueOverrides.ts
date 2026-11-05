// SPIKE (#1532): throwaway. An engine-neutral runtime for a theme's
// per-part catalogue overrides: plain style objects in, scoped CSS out,
// inserted once into the document head.
//
// Catalogue classes have stable names, whatever the engine:
//   .inv-badge, .inv-badge--tone_danger, .inv-card, .inv-card__title, ...
// A `replace` override is keyed by that name, minus the `inv-` prefix. A
// `merge` override is keyed by a selector (relative to the theme's root), and
// is laid over whatever is there (V1 card categories and hovers work this
// way).
//
// "Replace" (shallow) semantics: the rule goes into the SAME cascade layer as
// the base it replaces, with a higher specificity (scoped under
// [data-inv-theme]), and starts with `all: revert-layer`. Inside that layer,
// revert-layer means "as if this layer had no rules for this element", so the
// base rule is dropped entirely and the override's own declarations (later
// in the same rule) win. Layers above it are untouched.

import type { CSSProperties } from "react";

export type StyleObject = CSSProperties & {
  [key: string]: StyleObject | string | number | undefined;
};

export type CatalogueOverrides = {
  /** catalogue part name (e.g. `card__title`) -> its replacement */
  replace?: Record<string, StyleObject>;
  /** selector under the theme root -> styles laid over what's there */
  merge?: Record<string, StyleObject>;
};

export type CatalogueLayers = {
  /** the layer the base rules of a catalogue part live in */
  base: (part: string) => string;
  /** a layer above the catalogue, for merges */
  merge: string;
};

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

const kebab = (s: string) =>
  s.startsWith("--") ? s : s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const value = (key: string, v: string | number) =>
  typeof v === "number" && v !== 0 && !unitless.has(key) ? `${v}px` : String(v);

/** `:hover` and `&:hover` hang off the selector; `& > *` and `.x` nest. */
const nestSelector = (parent: string, key: string) =>
  key
    .split(",")
    .map((part) => part.trim())
    .map((part) =>
      part.includes("&")
        ? part.replaceAll("&", parent)
        : part.startsWith(":")
          ? `${parent}${part}`
          : `${parent} ${part}`,
    )
    .join(", ");

function serialize(
  selector: string,
  style: StyleObject,
  replace: boolean,
): string {
  const decls: string[] = replace ? ["all: revert-layer;"] : [];
  const nested: string[] = [];
  for (const [key, v] of Object.entries(style)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "object") {
      if (key.startsWith("@")) {
        nested.push(`${key} { ${serialize(selector, v, false)} }`);
      } else {
        nested.push(serialize(nestSelector(selector, key), v, false));
      }
    } else {
      decls.push(`${kebab(key)}: ${value(key, v)};`);
    }
  }
  return [`${selector} { ${decls.join(" ")} }`, ...nested].join("\n");
}

/** CSS for one theme's overrides, scoped to that theme. */
export function catalogueOverridesCss(
  slug: string,
  overrides: CatalogueOverrides,
  layers: CatalogueLayers,
) {
  const scope = `[data-inv-theme="${slug}"]`;
  const replace = Object.entries(overrides.replace ?? {}).map(
    ([name, style]) =>
      `@layer ${layers.base(name)} {\n${serialize(`${scope} .inv-${name}`, style, true)}\n}`,
  );
  const merge = Object.entries(overrides.merge ?? {}).map(([sel, style]) =>
    serialize(nestSelector(scope, sel), style, false),
  );
  return [...replace, `@layer ${layers.merge} {\n${merge.join("\n")}\n}`].join(
    "\n",
  );
}

/**
 * Put every theme's overrides into one <style> in the head. Replaces any
 * earlier one, so it can be called again when themes change.
 */
export function installCatalogueOverrides(
  themes: Record<string, CatalogueOverrides>,
  layers: CatalogueLayers,
  doc: Document = document,
) {
  const id = "investigator-catalogue-overrides";
  doc.getElementById(id)?.remove();
  const style = doc.createElement("style");
  style.id = id;
  style.textContent = Object.entries(themes)
    .map(([slug, overrides]) => catalogueOverridesCss(slug, overrides, layers))
    .join("\n");
  doc.head.append(style);
}

/**
 * The spike's demo overrides, to prove the mechanism. In real life these
 * would come from each theme's definition.
 */
export const spikeOverrides: Record<string, CatalogueOverrides> = {
  "nice-dark-red-agents": {
    replace: {
      // replace the badge's base: square, ruled, no outline. Its tone
      // variants (colours) should survive.
      badge: {
        borderRadius: "0",
        borderBottom: "2px solid var(--inv-glow)",
        padding: "0 0.3em",
        fontSize: "0.85em",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        lineHeight: 1.2,
      },
      // replace only the card's title slot; the other slots keep the base
      card__title: {
        fontStyle: "italic",
        textDecoration: "underline wavy var(--inv-glow)",
      },
      // the base subtitle is bold; replacing it with only italic must drop
      // the bold
      card__subtitle: { fontStyle: "italic" },
    },
  },
};
