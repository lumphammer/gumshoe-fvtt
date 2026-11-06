import type {
  CSSObject,
  ThemeSeedV1,
} from "@lumphammer/investigator-fvtt-types";

import { paletteVar } from "../palette";
import {
  type CatalogueOverrides,
  type OverrideStyle,
  splitSelectorList,
} from "./overrides";

/** Emotion's `:hover` attaches to the element; an override's bare selector is a descendant. */
const attach = (key: string) =>
  key.startsWith("@")
    ? key
    : splitSelectorList(key)
        .map((part) => (part.startsWith(":") ? `&${part}` : part))
        .join(", ");

/**
 * An Emotion style object as an override style: pseudo-classes attach to the
 * element, as Emotion has them, and a list of fallbacks keeps its last.
 */
function fromEmotion(style: CSSObject): OverrideStyle {
  return Object.fromEntries(
    Object.entries(style).flatMap(([key, value]) => {
      if (Array.isArray(value)) return [[key, value.at(-1)]];
      if (value !== null && typeof value === "object") {
        return [[attach(key), fromEmotion(value as CSSObject)]];
      }
      if (typeof value === "string" || typeof value === "number") {
        return [[key, value]];
      }
      return [];
    }),
  );
}

/**
 * The catalogue overrides a V1 seed's own styles become, so V1 themes keep
 * their look as their components are converted.
 *
 * In V1, a panel style replaced the panel's background (the call site gave
 * the padding), and a secondary panel used `panelStyleSecondary`, else
 * `panelStylePrimary`, else the secondary background. Each depth gets its own
 * override, so the two stay independent: the base keeps only the padding.
 */
export function catalogueFromV1(seed: ThemeSeedV1): CatalogueOverrides {
  const { panelStylePrimary: primary, panelStyleSecondary: secondary } = seed;
  if (!primary && !secondary) return {};
  return {
    panel: { padding: "0.5em" },
    "panel--depth_top": primary
      ? fromEmotion(primary)
      : { background: `var(${paletteVar("surface")})` },
    "panel--depth_nested": fromEmotion(
      secondary ??
        primary ?? { background: `var(${paletteVar("surfaceNested")})` },
    ),
  };
}
