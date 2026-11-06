import type {
  CSSObject,
  ThemeSeedV1,
} from "@lumphammer/investigator-fvtt-types";

import { paletteVar } from "../palette";
import type { ThemeV1 } from "../types";
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
 * In V1, a panel style replaced the panel's background (the call site gave
 * the padding), and a secondary panel used `panelStyleSecondary`, else
 * `panelStylePrimary`, else the secondary background. Each depth gets its own
 * override, so the two stay independent: the base keeps only the padding.
 */
function panelsFromV1(seed: ThemeSeedV1): CatalogueOverrides {
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

const tabFields = [
  "tabStyle",
  "tabActiveStyle",
  "tabSpacerStyle",
  "tabContentStyle",
  "tabWrappedStyle",
  "tabWrappedActiveStyle",
  "tabContentWrappedStyle",
] as const;

/**
 * In V1, a tab was `tabStyle` (with the display font and centred content
 * from the call site), with `tabActiveStyle` over it when selected in a row,
 * and `tabWrappedStyle` / `tabWrappedActiveStyle` over it in a grid; the
 * content had 0.5em padding from the call site, with `tabContentStyle` over
 * it, and `tabContentWrappedStyle` over that under a grid. A seed that sets
 * any of them gets all seven, as `themeFactory` filled them in.
 */
function tabsFromV1(seed: ThemeSeedV1, theme: ThemeV1): CatalogueOverrides {
  if (!tabFields.some((field) => seed[field])) return {};
  return {
    tabs__tab: {
      font: `var(${paletteVar("displayFont")})`,
      textTransform: `var(${paletteVar("displayCase")})`,
      letterSpacing: `var(${paletteVar("displayLetterSpacing")})`,
      textAlign: "center",
      ...fromEmotion(theme.tabStyle),
      ":not([data-wrapped]) > input:checked + &": fromEmotion(
        theme.tabActiveStyle,
      ),
      "[data-wrapped] > &": fromEmotion(theme.tabWrappedStyle),
      "[data-wrapped] > input:checked + &": fromEmotion(
        theme.tabWrappedActiveStyle,
      ),
    },
    tabs__spacer: fromEmotion(theme.tabSpacerStyle),
    tabs__content: {
      padding: "0.5em",
      ...fromEmotion(theme.tabContentStyle),
      "[data-wrapped] + &": fromEmotion(theme.tabContentWrappedStyle),
    },
  };
}

/**
 * The catalogue overrides a V1 seed's own styles become, so V1 themes keep
 * their look as their components are converted. `theme` is the seed as
 * `themeFactory` filled it in, for the V1 defaults of fields it left out.
 */
export function catalogueFromV1(
  seed: ThemeSeedV1,
  theme: ThemeV1,
): CatalogueOverrides {
  return { ...panelsFromV1(seed), ...tabsFromV1(seed, theme) };
}
