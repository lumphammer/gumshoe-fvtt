// SPIKE (#1532): throwaway. An engine-neutral runtime for a theme's
// per-part catalogue overrides: plain style objects in, scoped CSS out,
// inserted once into the document head.
//
// Catalogue classes have stable names, whatever the engine:
//   .inv-badge, .inv-badge--tone_danger, .inv-card, .inv-card__title, ...
// A theme override is keyed by that name, minus the `inv-` prefix.
//
// "Replace" (shallow) semantics: an override rule is written into the SAME
// cascade layer as the base catalogue, with a higher specificity (it's scoped
// under [data-inv-theme]), and starts with `all: revert-layer`. Inside that
// layer, revert-layer means "as if this layer had no rules for this
// element", so the base rule is dropped entirely, and the override's own
// declarations (later in the same rule) win. Layers above (call-site layout)
// are untouched.

import type { CSSProperties } from "react";

export type StyleObject = CSSProperties & {
  [selector: `&${string}` | `:${string}`]: StyleObject;
};

export type CatalogueOverrides = Record<string, StyleObject>;

const kebab = (s: string) =>
  s.startsWith("--") ? s : s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function serialize(selector: string, style: StyleObject, replace: boolean) {
  const decls: string[] = replace ? ["all: revert-layer;"] : [];
  const nested: string[] = [];
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "object") {
      const sub = key.startsWith(":")
        ? `${selector}${key}`
        : key.replaceAll("&", selector);
      nested.push(serialize(sub, value as StyleObject, false));
    } else {
      decls.push(`${kebab(key)}: ${String(value)};`);
    }
  }
  return [`${selector} { ${decls.join(" ")} }`, ...nested].join("\n");
}

/** CSS for one theme's overrides, scoped to that theme, in `layer`. */
export function catalogueOverridesCss(
  slug: string,
  overrides: CatalogueOverrides,
  layer: string,
) {
  const rules = Object.entries(overrides).map(([name, style]) =>
    serialize(`[data-inv-theme="${slug}"] .inv-${name}`, style, true),
  );
  return `@layer ${layer} {\n${rules.join("\n")}\n}`;
}

/**
 * Put every theme's overrides into one <style> in the head. Replaces any
 * earlier one, so it can be called again when themes change.
 */
export function installCatalogueOverrides(
  themes: Record<string, CatalogueOverrides>,
  layer: string,
  doc: Document = document,
) {
  const id = "investigator-catalogue-overrides";
  doc.getElementById(id)?.remove();
  const style = doc.createElement("style");
  style.id = id;
  style.textContent = Object.entries(themes)
    .map(([slug, overrides]) => catalogueOverridesCss(slug, overrides, layer))
    .join("\n");
  doc.head.append(style);
}

/**
 * The spike's demo overrides, for one theme, to prove the mechanism. In real
 * life these would come from each theme's definition.
 */
export const spikeOverrides: Record<string, CatalogueOverrides> = {
  "nice-dark-red-agents": {
    // replace the whole badge: square, ruled, no outline
    badge: {
      borderRadius: "0",
      borderBottom: "2px solid var(--inv-glow)",
      padding: "0 0.3em",
      fontSize: "0.85em",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    // replace only the card's title slot; the other slots keep the base
    card__title: {
      fontStyle: "italic",
      textDecoration: "underline wavy var(--inv-glow)",
    },
  },
};
