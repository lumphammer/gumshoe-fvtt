import type {
  CSSObject,
  ThemeSeedV1,
} from "@lumphammer/investigator-fvtt-types";

import { paletteVar } from "../palette";
import type { ThemeV1 } from "../types";
import { backdropForced, logoDefaults, measureForced } from "./logoDefaults";
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
 * element, as Emotion has them, and a list of fallbacks stays a list.
 */
function fromEmotion(style: CSSObject): OverrideStyle {
  return Object.fromEntries(
    Object.entries(style).flatMap(
      ([key, value]): [string, OverrideStyle[string]][] => {
        // fallbacks: all of them, in order (the serializer repeats the
        // declaration for each)
        if (Array.isArray(value)) {
          return [
            [
              key,
              (value as unknown[]).filter(
                (v): v is string | number =>
                  typeof v === "string" || typeof v === "number",
              ),
            ],
          ];
        }
        if (value !== null && typeof value === "object") {
          return [[attach(key), fromEmotion(value as CSSObject)]];
        }
        if (typeof value === "string" || typeof value === "number") {
          return [[key, value]];
        }
        return [];
      },
    ),
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
 * In V1, a sheet's root was the defaults (wallpaper and so on) with
 * `largeSheetRootStyle` or `smallSheetRootStyle` spread over them; every
 * seed has the large one. They patch the `size` variants (a variant override
 * goes over the default), so they keep that composition.
 */
function sheetRootFromV1(theme: ThemeV1): CatalogueOverrides {
  return {
    "sheet-root--size_large": fromEmotion(theme.largeSheetRootStyle),
    "sheet-root--size_small": fromEmotion(theme.smallSheetRootStyle),
  };
}

/**
 * In V1, `appWindowStyle` went on the window around the sheet, over Foundry's
 * own look: the frame's `root` is empty by default, so it's that look.
 */
function appFrameFromV1(seed: ThemeSeedV1): CatalogueOverrides {
  return seed.appWindowStyle
    ? { "app-frame__root": fromEmotion(seed.appWindowStyle) }
    : {};
}

/**
 * In V1, each part of the logo was its defaults with the theme's style for it
 * spread over them (the front style over the name, its measuring copy and the
 * subtext; the rear style over their rear copies). Every seed has a logo.
 */
function logoFromV1(theme: ThemeV1): CatalogueOverrides {
  const { logo } = theme;
  const over = (
    defaults: Record<string, string | number>,
    style: CSSObject | undefined,
  ): OverrideStyle => ({ ...defaults, ...fromEmotion(style ?? {}) });
  return {
    // the backdrop always fills the logo (layout in LogoEditable), so its
    // position and insets aren't the theme's, even with !important
    logo__backdrop: Object.fromEntries(
      Object.entries(over(logoDefaults.backdrop, logo.backdropStyle)).filter(
        ([key]) => !(backdropForced as readonly string[]).includes(key),
      ),
    ),
    logo__text: over(logoDefaults.text, logo.textElementsStyle),
    logo__front_wrapper: over(
      logoDefaults.front_wrapper,
      logo.frontTextElementWrapperStyle,
    ),
    logo__front: over(logoDefaults.front, logo.frontTextElementStyle),
    logo__front_sub: over(logoDefaults.front_sub, logo.frontTextElementStyle),
    // the front style, with the measuring copy's position and size last
    logo__measure: {
      ...over(logoDefaults.measure, logo.frontTextElementStyle),
      ...measureForced,
    },
    logo__rear_wrapper: over(
      logoDefaults.rear_wrapper,
      logo.rearTextElementWrapperStyle,
    ),
    logo__rear: over(logoDefaults.rear, logo.rearTextElementStyle),
    logo__rear_sub: over(logoDefaults.rear_sub, logo.rearTextElementStyle),
  };
}

/** V1's names for the card's parts, by slot. */
const v1CardStyleNames = {
  root: "backdropStyle",
  supertitle: "supertitleStyle",
  title: "titleStyle",
  subtitle: "subtitleStyle",
  description: "descriptionStyle",
  effect: "effectStyle",
} as const;

/** A style key, as a quoted attribute value: anything but a word character is hex-escaped. */
const attributeValue = (key: string) =>
  `"${key.replace(/[^\w-]/g, (c) => `\\${c.codePointAt(0)!.toString(16)} `)}"`;

/**
 * In V1, each part of a card was its `themeFactory` style (the defaults, or
 * the seed's `cards.base` style for that part, replacing them whole), with
 * its category's (`cards.categories`, by the card's style key) spread over
 * it. Each category becomes its own rule here, with the two spread together,
 * and the base rule leaves out the categories' cards, so a category's style
 * wins as it did in V1 (`!important`, nested rules and fallbacks included).
 * Their contexts are in `:where()`, so both are as specific as the plain
 * class. A card in a card array also had the hover style (the base's, then
 * its category's, over it) under the pointer: that's a `:hover` rule in the
 * root's. Only for a seed that styles its cards.
 */
function cardsFromV1(seed: ThemeSeedV1, theme: ThemeV1): CatalogueOverrides {
  const categories = Object.entries(seed.cards?.categories ?? {});
  if (!seed.cards?.base && categories.length === 0) return {};
  const keys = categories.map(([key]) => attributeValue(key));
  const anyCategory = keys.map((key) => `[data-category=${key}]`).join(", ");
  return Object.fromEntries(
    (Object.keys(v1CardStyleNames) as (keyof typeof v1CardStyleNames)[]).map(
      (slot) => {
        const name = v1CardStyleNames[slot];
        // a card in a card array (clickable) had the hover style on top
        const withHover = (style: CSSObject, hover: CSSObject | undefined) =>
          slot === "root" && hover
            ? { ...style, "&.investigator-card-array-card:hover": hover }
            : style;
        const base = withHover(
          theme.cards.base[name],
          theme.cards.base.hoverStyle,
        );
        if (categories.length === 0) {
          return [`card__${slot}`, fromEmotion(base)];
        }
        const within = (context: string) =>
          slot === "root"
            ? `&:where(${context})`
            : `:where(.inv-card__root:is(${context})) &`;
        const style: OverrideStyle = {
          [within(`:not(${anyCategory})`)]: fromEmotion(base),
        };
        categories.forEach(([, category], i) => {
          style[within(`[data-category=${keys[i]}]`)] = fromEmotion(
            withHover(
              { ...theme.cards.base[name], ...category[name] },
              category.hoverStyle
                ? { ...theme.cards.base.hoverStyle, ...category.hoverStyle }
                : theme.cards.base.hoverStyle,
            ),
          );
        });
        return [`card__${slot}`, style];
      },
    ),
  );
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
  return {
    ...appFrameFromV1(seed),
    ...sheetRootFromV1(theme),
    ...logoFromV1(theme),
    ...cardsFromV1(seed, theme),
    ...panelsFromV1(seed),
    ...tabsFromV1(seed, theme),
  };
}
