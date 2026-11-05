// SPIKE (#1532): throwaway. V1 theme -> catalogue overrides, for the card
// only, to see what the compatibility path looks like.

import type { ThemeV1 } from "../types";
import type { CatalogueOverrides, StyleObject } from "./catalogueOverrides";

const slots = {
  supertitle: "supertitleStyle",
  title: "titleStyle",
  subtitle: "subtitleStyle",
  description: "descriptionStyle",
  effect: "effectStyle",
} as const;

const s = (x: unknown) => (x ?? {}) as StyleObject;

export function v1CardOverrides(theme: ThemeV1): CatalogueOverrides {
  const { base, categories } = theme.cards;
  const replace: Record<string, StyleObject> = {
    card: s(base.backdropStyle),
  };
  for (const [slot, key] of Object.entries(slots)) {
    replace[`card__${slot}`] = s(base[key]);
  }
  const merge: Record<string, StyleObject> = {
    // only cards in an array light up on hover, as before
    ".inv-card.investigator-card-array-card:hover": s(base.hoverStyle),
  };
  for (const [category, styles] of Object.entries(categories)) {
    const root = `.inv-card.${category}`;
    merge[root] = s(styles.backdropStyle);
    merge[`${root}.investigator-card-array-card:hover`] = s(styles.hoverStyle);
    for (const [slot, key] of Object.entries(slots)) {
      merge[`${root} .inv-card__${slot}`] = s(styles[key]);
    }
  }
  return { replace, merge };
}
