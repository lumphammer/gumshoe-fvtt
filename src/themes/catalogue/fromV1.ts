import type {
  CSSObject,
  ThemeSeedV1,
} from "@lumphammer/investigator-fvtt-types";

import { paletteVar } from "../palette";
import type { CatalogueOverrides, OverrideStyle } from "./overrides";

/**
 * An Emotion style object as an override style: `:hover` and the like
 * attach to the element, as Emotion has them (an override's bare selector is
 * a descendant), and a list of fallbacks keeps its last.
 */
function fromEmotion(style: CSSObject): OverrideStyle {
  return Object.fromEntries(
    Object.entries(style).flatMap(([key, value]) => {
      const selector = key.startsWith(":") ? `&${key}` : key;
      if (Array.isArray(value)) return [[selector, value.at(-1)]];
      if (value !== null && typeof value === "object") {
        return [[selector, fromEmotion(value as CSSObject)]];
      }
      if (typeof value === "string" || typeof value === "number") {
        return [[selector, value]];
      }
      return [];
    }),
  );
}

/**
 * The catalogue overrides a V1 seed's own styles become, so V1 themes keep
 * their look as their components are converted.
 *
 * An override replaces the class's default, so each one starts from the
 * default's declarations: a V1 panel style was spread over them.
 */
export function catalogueFromV1(seed: ThemeSeedV1): CatalogueOverrides {
  const overrides: CatalogueOverrides = {};
  if (seed.panelStylePrimary) {
    overrides["panel"] = {
      background: `var(${paletteVar("surface")})`,
      padding: "0.5em",
      ...fromEmotion(seed.panelStylePrimary),
    };
  }
  if (seed.panelStyleSecondary) {
    overrides["panel--depth_nested"] = {
      background: `var(${paletteVar("surfaceNested")})`,
      ...fromEmotion(seed.panelStyleSecondary),
    };
  }
  return overrides;
}
