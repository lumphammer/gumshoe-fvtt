import type {
  CSSObject,
  ThemeCatalogue,
  ThemeStyle,
} from "@lumphammer/investigator-fvtt-types";

import { paletteVar } from "../palette";
import type { ThemeV1 } from "../types";
import { backdropForced, logoDefaults, measureForced } from "./logoDefaults";
import {
  calloutTint,
  dragHandleDefaults,
  fieldDefaults,
} from "./sharedDefaults";
import { tones } from "./tones";
import { hasParent, type OverrideStyle, splitSelectorList } from "./overrides";

/**
 * An Emotion selector as an override's: a pseudo-class attaches to the
 * element, as Emotion has it, and a bare selector is a descendant, which a
 * ThemeV2 style says with `&`.
 */
const attach = (key: string) =>
  key.startsWith("@")
    ? key
    : splitSelectorList(key)
        .map((part) =>
          part.startsWith(":")
            ? `&${part}`
            : hasParent(part)
              ? part
              : `& ${part}`,
        )
        .join(", ");

/** An override style as a theme's (ThemeV2's types are stricter). */
const themeStyle = (style: OverrideStyle) => style as ThemeStyle;

/** `over` on top of `under`, nested rules merged too. */
function merge(under: OverrideStyle, over: OverrideStyle): OverrideStyle {
  const result: OverrideStyle = { ...under };
  for (const [key, value] of Object.entries(over)) {
    const current = result[key];
    result[key] =
      isStyle(value) && isStyle(current) ? merge(current, value) : value;
  }
  return result;
}

const isStyle = (value: unknown): value is OverrideStyle =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * An Emotion style object as an override style: pseudo-classes attach to the
 * element, as Emotion has them, and a list of fallbacks stays a list. Two
 * keys that come to the same selector (`h1` and `& h1`) are one rule, the
 * later's declarations over the earlier's, as their two rules were.
 */
function fromEmotion(style: CSSObject): OverrideStyle {
  const result: OverrideStyle = {};
  for (const [key, value] of entriesOf(style)) {
    const current = result[key];
    result[key] =
      isStyle(value) && isStyle(current) ? merge(current, value) : value;
  }
  return result;
}

function entriesOf(style: CSSObject): [string, OverrideStyle[string]][] {
  return Object.entries(style).flatMap(
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
  );
}

/**
 * A V1 panel style replaced the panel's background, but a depth override
 * patches the default's (a surface colour): one without a background of its
 * own clears the default's colour.
 */
const ownBackground = (style: OverrideStyle): OverrideStyle =>
  "background" in style || "backgroundColor" in style
    ? style
    : { ...style, backgroundColor: "transparent" };

/**
 * In V1, a panel style replaced the panel's background (the call site gave
 * the padding), and a secondary panel used `panelStyleSecondary`, else
 * `panelStylePrimary`, else the secondary background. Each depth gets its own
 * override, so the two stay independent: the base keeps only the padding.
 * `themeFactory` has no default panel styles, so a theme without them gets
 * the catalogue's panels, which look the same.
 */
function panelsFromV1(theme: ThemeV1): ThemeCatalogue {
  const { panelStylePrimary: primary, panelStyleSecondary: secondary } = theme;
  if (!primary && !secondary) return {};
  const nested = secondary ?? primary;
  return {
    panel: {
      base: { padding: "0.5em" },
      variants: {
        depth: {
          top: themeStyle(
            primary
              ? ownBackground(fromEmotion(primary))
              : { background: `var(${paletteVar("surface")})` },
          ),
          nested: themeStyle(
            nested
              ? ownBackground(fromEmotion(nested))
              : { background: `var(${paletteVar("surfaceNested")})` },
          ),
        },
      },
    },
  };
}

/**
 * In V1, a tab was `tabStyle` (with the display font and centred content
 * from the call site), with `tabActiveStyle` over it when selected in a row,
 * and `tabWrappedStyle` / `tabWrappedActiveStyle` over it in a grid; the
 * content had 0.5em padding from the call site, with `tabContentStyle` over
 * it, and `tabContentWrappedStyle` over that under a grid. `themeFactory`
 * fills in all seven, so every V1 theme gets V1's tabs, its defaults
 * included, and not the catalogue's.
 */
function tabsFromV1(theme: ThemeV1): ThemeCatalogue {
  const tab: OverrideStyle = {
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
    // V1's tabs dropped any hover glow on a disabled tab
    "input:disabled + &:hover": { textShadow: "none" },
  };
  const content: OverrideStyle = {
    padding: "0.5em",
    ...fromEmotion(theme.tabContentStyle),
    "[data-wrapped] + &": fromEmotion(theme.tabContentWrappedStyle),
  };
  return {
    tabs: {
      base: {
        tab: themeStyle(tab),
        spacer: themeStyle(fromEmotion(theme.tabSpacerStyle)),
        content: themeStyle(content),
      },
    },
  };
}

/**
 * In V1, a sheet's root was the defaults (wallpaper and so on) with
 * `largeSheetRootStyle` or `smallSheetRootStyle` spread over them; every
 * seed has the large one. They patch the `size` variants (a variant override
 * goes over the default), so they keep that composition.
 */
function sheetRootFromV1(theme: ThemeV1): ThemeCatalogue {
  return {
    sheetRoot: {
      variants: {
        size: {
          large: themeStyle(fromEmotion(theme.largeSheetRootStyle)),
          small: themeStyle(fromEmotion(theme.smallSheetRootStyle)),
        },
      },
    },
  };
}

/**
 * In V1, `appWindowStyle` went on the window around the sheet, over Foundry's
 * own look: the frame's `root` is empty by default, so it's that look.
 */
function appFrameFromV1(theme: ThemeV1): ThemeCatalogue {
  return theme.appWindowStyle
    ? {
        appFrame: {
          base: { root: themeStyle(fromEmotion(theme.appWindowStyle)) },
        },
      }
    : {};
}

/**
 * In V1, each part of the logo was its defaults with the theme's style for it
 * spread over them (the front style over the name, its measuring copy and the
 * subtext; the rear style over their rear copies). Every seed has a logo.
 */
function logoFromV1(theme: ThemeV1): ThemeCatalogue {
  const { logo } = theme;
  const over = (
    defaults: Record<string, string | number>,
    style: CSSObject | undefined,
  ): OverrideStyle => ({ ...defaults, ...fromEmotion(style ?? {}) });
  return {
    logo: {
      base: {
        // the backdrop always fills the logo (layout in LogoEditable), so its
        // position and insets aren't the theme's, even with !important
        backdrop: themeStyle(
          Object.fromEntries(
            Object.entries(
              over(logoDefaults.backdrop, logo.backdropStyle),
            ).filter(
              ([key]) => !(backdropForced as readonly string[]).includes(key),
            ),
          ),
        ),
        text: themeStyle(over(logoDefaults.text, logo.textElementsStyle)),
        front_wrapper: themeStyle(
          over(logoDefaults.front_wrapper, logo.frontTextElementWrapperStyle),
        ),
        front: themeStyle(over(logoDefaults.front, logo.frontTextElementStyle)),
        front_sub: themeStyle(
          over(logoDefaults.front_sub, logo.frontTextElementStyle),
        ),
        // the front style, with the measuring copy's position and size last
        measure: themeStyle({
          ...over(logoDefaults.measure, logo.frontTextElementStyle),
          ...measureForced,
        }),
        rear_wrapper: themeStyle(
          over(logoDefaults.rear_wrapper, logo.rearTextElementWrapperStyle),
        ),
        rear: themeStyle(over(logoDefaults.rear, logo.rearTextElementStyle)),
        rear_sub: themeStyle(
          over(logoDefaults.rear_sub, logo.rearTextElementStyle),
        ),
      },
    },
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
 * root's. Every V1 theme gets them, `themeFactory`'s defaults included.
 */
function cardsFromV1(theme: ThemeV1): ThemeCatalogue {
  const categories = Object.entries(theme.cards.categories);
  const keys = categories.map(([key]) => attributeValue(key));
  const anyCategory = keys.map((key) => `[data-category=${key}]`).join(", ");
  const slots = Object.fromEntries(
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
          return [slot, themeStyle(fromEmotion(base))];
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
        return [slot, themeStyle(style)];
      },
    ),
  );
  return { card: { base: slots } };
}

/**
 * V1's surfaces could be translucent, and things that overlap other content
 * (menus, sticky headers, cards) were on them flattened over the wallpaper
 * (`bgOpaque*`). The palette's surfaces are expected to be opaque, so the recipes for those
 * things use them as they are: these put V1's flattened ones back. V1's
 * danger-tinted surfaces (`bgTransDanger*`) kept the surface's opacity, which
 * the recipe's tint doesn't, so they're put back too.
 */
function surfacesFromV1(theme: ThemeV1): ThemeCatalogue {
  const {
    bgOpaquePrimary: top,
    bgOpaqueSecondary: nested,
    bgOpaqueDangerPrimary: dangerTop,
    bgOpaqueDangerSecondary: dangerNested,
    bgTransDangerPrimary: dangerTopTrans,
    bgTransDangerSecondary: dangerNestedTrans,
  } = theme.colors;
  const cell = (
    odd: boolean,
    zero: boolean,
    header: boolean,
    background: string,
  ) => ({ header, odd, zero, css: { background } });
  return {
    surface: {
      compoundVariants: [
        { depth: "top", solid: true, css: { backgroundColor: top } },
        { depth: "nested", solid: true, css: { backgroundColor: nested } },
      ],
    },
    floating: { base: { background: top } },
    partyCell: {
      compoundVariants: [
        cell(true, false, true, top),
        cell(false, false, true, nested),
        cell(true, true, true, dangerTop),
        cell(false, true, true, dangerNested),
        cell(true, true, false, dangerTopTrans),
        cell(false, true, false, dangerNestedTrans),
      ],
    },
    select: {
      base: themeStyle({
        ...fieldDefaults,
        background: nested,
        "& option": { background: top, color: `var(${paletteVar("text")})` },
      }),
    },
    dragHandle: {
      base: themeStyle({ ...dragHandleDefaults, background: top }),
    },
    callout: {
      variants: {
        tone: Object.fromEntries(
          tones.map((tone) => [tone, { background: calloutTint(tone, top) }]),
        ),
      },
    },
  };
}

/**
 * The catalogue (ThemeV2's) a V1 theme's styles become, so V1 themes keep
 * their look. `theme` is the seed as `themeFactory` filled it in: V1's
 * defaults for the fields a seed leaves out are part of the V1 contract too,
 * so they become overrides as well.
 */
export function catalogueFromV1(theme: ThemeV1): ThemeCatalogue {
  return {
    ...appFrameFromV1(theme),
    ...sheetRootFromV1(theme),
    ...logoFromV1(theme),
    ...surfacesFromV1(theme),
    ...cardsFromV1(theme),
    ...panelsFromV1(theme),
    ...tabsFromV1(theme),
  };
}
