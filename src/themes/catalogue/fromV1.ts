import type {
  CSSObject,
  ThemeCatalogue,
  ThemeFont,
  ThemeFonts,
  ThemePalette,
  ThemeStyle,
  ThemeV2,
} from "@lumphammer/investigator-fvtt-types";

import { displayFontSize, displaySizeVar, textStyleCss } from "../fonts";
import { paletteVar } from "../palette";
import type { ThemeV1 } from "../types";
import { logoDefaults } from "./logoDefaults";
import { type Tone, tones } from "./tones";

/*
 * V1 themes (`ThemeSeedV1`, filled in by `themeFactory`) as V2 themes that
 * look much the same. Everything V1 is here, so it can all go when V1 does.
 */

/** A style as it's built here: any key, before it's a `ThemeStyle`. */
type Style = {
  [key: string]: string | number | (string | number)[] | Style | undefined;
};

const themeStyle = (style: Style) => style as ThemeStyle;

const isStyle = (value: unknown): value is Style =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isValue = (value: unknown): value is string | number =>
  typeof value === "string" || typeof value === "number";

/**
 * An Emotion selector as CSS nesting has it: a pseudo-class attaches to the
 * element (`:hover` is `&:hover`), and anything else without `&` is a
 * descendant. Each selector in a list, split at its top-level commas.
 */
const attach = (key: string) =>
  key.startsWith("@")
    ? key
    : key
        .split(/,(?![^(]*\))/)
        .map((part) => part.trim())
        .map((part) =>
          part.startsWith(":")
            ? `&${part}`
            : part.includes("&")
              ? part
              : `& ${part}`,
        )
        .join(", ");

/** `over` on top of `under`, nested rules merged too. */
function merge(under: Style, over: Style): Style {
  const result: Style = { ...under };
  for (const [key, value] of Object.entries(over)) {
    const current = result[key];
    result[key] =
      isStyle(value) && isStyle(current) ? merge(current, value) : value;
  }
  return result;
}

/**
 * An Emotion style object as a V2 style. Two keys that come to the same
 * selector (`h1` and `& h1`) are one rule, the later's declarations over the
 * earlier's, as their two rules were.
 */
function fromEmotion(style: CSSObject | undefined): Style {
  const result: Style = {};
  for (const [key, value] of Object.entries(style ?? {})) {
    if (Array.isArray(value)) {
      // fallbacks
      result[key] = (value as unknown[]).filter(isValue);
    } else if (isStyle(value)) {
      const selector = attach(key);
      const nested = fromEmotion(value);
      const current = result[selector];
      result[selector] = isStyle(current) ? merge(current, nested) : nested;
    } else if (isValue(value)) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * A V1 style that replaced the catalogue's default whole, where a V2
 * override patches it: it starts from nothing.
 */
const replacing = (style: Style): Style => ({
  all: "revert-layer",
  ...style,
});

/**
 * Light ink means a dark theme: the text's relative luminance (WCAG's, which
 * is XYZ's Y), as the browser reads it, so it's measured as a theme is
 * installed, not converted. Light if it can't be read here (a `var()`, which
 * only means something inside a themed root).
 */
export function polarityOf(text: string): ThemePalette["polarity"] {
  if (/var\(/i.test(text)) return "light";
  const probe = document.createElement("div");
  probe.style.color = `color(from ${text} xyz y y y)`;
  if (!probe.style.color) return "light";
  document.documentElement.append(probe);
  const [, luminance] =
    /^color\(xyz-d65 (\S+)/.exec(getComputedStyle(probe).color) ?? [];
  probe.remove();
  // where black starts to read better than white on it
  return Number(luminance) > 0.179 ? "dark" : "light";
}

/**
 * A V1 theme's palette. V1's surfaces can be translucent, so it has no solid
 * surfaces: `palette.css` mixes with the translucent ones, which is the same
 * once it's over the wallpaper, and the parts on the solid surfaces are
 * layered over the wallpaper (`solidsFromV1`).
 */
export function paletteFromV1(
  theme: ThemeV1,
  polarity: ThemePalette["polarity"],
): ThemePalette {
  const { colors } = theme;
  return {
    polarity,
    wallpaper: colors.wallpaper,
    surface: colors.backgroundPrimary,
    surfaceNested: colors.backgroundSecondary,
    control: colors.backgroundButton,
    text: colors.text,
    accent: colors.accent,
    onAccent: colors.accentContrast,
    feedback: colors.glow,
    line: colors.controlBorder,
    danger: colors.danger,
    warning: colors.warning,
    success: colors.success,
    info: "#2b6cb0",
    // a row gap, then a column gap
    cardGap: `${theme.cards.area.verticalSpacing} ${theme.cards.area.horizontalSpacing}`,
  };
}

/** The parts of a CSS `font` shorthand, as far as V1 themes used it. */
type FontShorthand = Omit<ThemeFont, "case" | "letterSpacing" | "scale"> & {
  size?: string;
};

const fontSize =
  /(?:[\d.]+(?:px|em|rem|%|pt|ex|ch|vw|vh)|(?:xx?x?-)?(?:small|large)|medium|smaller|larger)/;

/**
 * Size keywords as lengths, so they can go in a `calc()`: the absolute ones
 * at the browser's default 16px, and the relative ones by CSS's suggested
 * ratio of 1.2.
 */
const sizeKeywords: Record<string, string> = {
  "xx-small": "9px",
  "x-small": "10px",
  small: "13px",
  medium: "16px",
  large: "18px",
  "x-large": "24px",
  "xx-large": "32px",
  "xxx-large": "48px",
  smaller: `${1 / 1.2}em`,
  larger: "1.2em",
};

/**
 * A CSS `font` shorthand (`"normal small-caps 600 1.2em 'Saira', serif"`)
 * taken apart: the keywords before the size, the size (a keyword as a
 * length), a line height after it, and the family. What it doesn't give is
 * `normal`, as the shorthand resets it. Undefined if it has no size, as a
 * `font` value must (a system font, `caption`, can't be taken apart).
 */
export function parseFontShorthand(value: string): FontShorthand | undefined {
  const match = new RegExp(
    `^((?:\\S+\\s+)*?)(${fontSize.source})(?:\\s*/\\s*(\\S+))?\\s+(.+)$`,
  ).exec(value.trim());
  if (!match) return undefined;
  const [, keywords = "", size = "", lineHeight = "normal", family = ""] =
    match;
  const font: FontShorthand = {
    weight: "normal",
    stretch: "normal",
    style: "normal",
    caps: "normal",
    lineHeight,
    size: sizeKeywords[size] ?? size,
    family: family.trim(),
  };
  for (const word of keywords.split(/\s+/).filter(Boolean)) {
    if (/^(italic|oblique)$/.test(word)) {
      font.style = word;
    } else if (font.style === "oblique" && /^-?[\d.]+deg$/.test(word)) {
      font.style = `oblique ${word}`;
    } else if (word === "small-caps") {
      font.caps = word;
    } else if (/^(bold|bolder|lighter|\d+)$/.test(word)) {
      font.weight = word;
    } else if (/^((ultra|extra|semi)-)?(condensed|expanded)$/.test(word)) {
      font.stretch = word;
    }
  }
  return font;
}

/**
 * A V1 theme's fonts. V1 had a `font` shorthand for each text style: its
 * size becomes the base size for body text, and the scale for display text
 * (an em or percentage, or a size in pixels over a body size in pixels).
 */
export function fontsFromV1(theme: ThemeV1): ThemeFonts {
  const fonts: ThemeFonts = {};
  const body = theme.bodyFont ? parseFontShorthand(theme.bodyFont) : undefined;
  if (body) {
    const { size, ...font } = body;
    fonts.baseSize = size;
    fonts.body = font;
  }
  const display = theme.displayFont
    ? parseFontShorthand(theme.displayFont)
    : undefined;
  if (display) {
    const { size = "", ...font } = display;
    const [, amount, unit] = /^([\d.]+)(em|%|px)$/.exec(size) ?? [];
    const [, bodyPixels] = /^([\d.]+)px$/.exec(body?.size ?? "") ?? [];
    const scale =
      unit === "em"
        ? Number(amount)
        : unit === "%"
          ? Number(amount) / 100
          : unit === "px" && bodyPixels
            ? Number(amount) / Number(bodyPixels)
            : 1;
    fonts.display = { ...font, ...(scale !== 1 ? { scale } : {}) };
  }
  if (theme.displayFontTextTransform) {
    fonts.display = {
      ...fonts.display,
      case: theme.displayFontTextTransform as ThemeFont["case"],
    };
  }
  return fonts;
}

/**
 * In V1, a panel style replaced the panel's background, and a nested panel
 * used `panelStyleSecondary`, else `panelStylePrimary`. V1's top panels are
 * regions now, and its nested ones panels: the primary style patches
 * `region`, and the secondary (else the primary) `panel`. A style without a
 * background of its own clears the default's.
 */
function panelsFromV1(theme: ThemeV1): ThemeCatalogue {
  const { panelStylePrimary: primary, panelStyleSecondary: secondary } = theme;
  if (!primary && !secondary) return {};
  const patch = (style: CSSObject | undefined) => {
    const own = fromEmotion(style);
    return themeStyle(
      "background" in own || "backgroundColor" in own
        ? own
        : { backgroundColor: "transparent", ...own },
    );
  };
  return {
    ...(primary ? { region: { base: patch(primary) } } : {}),
    panel: { base: patch(secondary ?? primary) },
  };
}

/**
 * In V1, a tab was `tabStyle`, with `tabActiveStyle` over it when selected
 * in a row, and `tabWrappedStyle` / `tabWrappedActiveStyle` over it in a
 * grid; the content was `tabContentStyle`, with `tabContentWrappedStyle`
 * over it under a grid. `themeFactory` fills in all seven, so every V1 theme
 * gets V1's tabs, and not the catalogue's. Wrapped is the tabs' attribute;
 * selected and disabled are the tabs' states.
 *
 * In V1, a selected tab was the tab's look with the active style over it,
 * so the selected state starts from nothing (the tab's own look), not the
 * catalogue's selected look.
 */
function tabsFromV1(theme: ThemeV1): ThemeCatalogue {
  return {
    tabs: {
      base: {
        tab: themeStyle(
          replacing({
            ...textStyleCss("display"),
            // the display style's own size (`revert-layer` doesn't undo
            // the catalogue's custom property), unless V1's tab style has
            // one, as it does by default
            [displaySizeVar]: "1",
            fontSize: displayFontSize,
            textAlign: "center",
            ...fromEmotion(theme.tabStyle),
            "&[data-wrapped]": fromEmotion(theme.tabWrappedStyle),
          }),
        ),
        spacer: themeStyle(replacing(fromEmotion(theme.tabSpacerStyle))),
        content: themeStyle(
          replacing({
            padding: "0.5em",
            ...fromEmotion(theme.tabContentStyle),
            "&[data-wrapped]": fromEmotion(theme.tabContentWrappedStyle),
          }),
        ),
      },
      states: {
        selected: {
          tab: themeStyle(
            replacing({
              "&:not([data-wrapped])": fromEmotion(theme.tabActiveStyle),
              "&[data-wrapped]": fromEmotion(theme.tabWrappedActiveStyle),
            }),
          ),
        },
        // V1's tabs dropped any hover glow on a disabled tab
        disabled: { tab: { "&:hover": { textShadow: "none" } } },
      },
    },
  };
}

/**
 * In V1, each part of the logo was its defaults with the theme's style for
 * it spread over them (the front style over the name and the subtext; the
 * rear style over their rear copies). The layout is `LogoEditable`'s now.
 *
 * Two things moved. The text's size is inherited now, from 4em above it, so
 * a relative size of its own is a quarter of what it was. And the rear
 * copy's wrapper's text is always transparent, so a colour the theme gave it
 * goes on the rear copies instead.
 */
function logoFromV1({ logo }: ThemeV1): ThemeCatalogue {
  const over = (slot: keyof typeof logoDefaults, style?: CSSObject): Style => ({
    ...logoDefaults[slot],
    ...fromEmotion(style),
  });
  const text = over("text", logo.textElementsStyle);
  const { fontSize } = text;
  if (
    typeof fontSize === "string" &&
    fontSize !== "1em" &&
    /^[\d.]+(em|%)$/.test(fontSize)
  ) {
    text["fontSize"] = `calc(${fontSize} / 4)`;
  }
  const rearColor = logo.rearTextElementWrapperStyle?.color;
  const rear = (slot: "rear" | "rear_sub") => ({
    ...(isValue(rearColor) ? { color: rearColor } : {}),
    ...over(slot, logo.rearTextElementStyle),
  });
  return {
    logo: {
      base: {
        backdrop: themeStyle(over("backdrop", logo.backdropStyle)),
        text: themeStyle(text),
        front_wrapper: themeStyle(
          over("front_wrapper", logo.frontTextElementWrapperStyle),
        ),
        front: themeStyle(over("front", logo.frontTextElementStyle)),
        front_sub: themeStyle(over("front_sub", logo.frontTextElementStyle)),
        rear_wrapper: themeStyle(
          over("rear_wrapper", logo.rearTextElementWrapperStyle),
        ),
        rear: themeStyle(rear("rear")),
        rear_sub: themeStyle(rear("rear_sub")),
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
 * it: a nested rule on the root's `data-category` here. A card in a card
 * array also had the hover style under the pointer.
 */
function cardsFromV1({ cards }: ThemeV1): ThemeCatalogue {
  const slot = (slot: keyof typeof v1CardStyleNames) => {
    const name = v1CardStyleNames[slot];
    const part = (styles: Partial<typeof cards.base>): Style => ({
      // a colour alone replaced the base's, which is layered (`themeFactory`)
      ...(styles[name]?.backgroundColor ? { backgroundImage: "none" } : {}),
      ...fromEmotion(styles[name]),
      ...(slot === "root" && styles.hoverStyle
        ? {
            "&.investigator-card-array-card:hover": fromEmotion(
              styles.hoverStyle,
            ),
          }
        : {}),
    });
    const style = replacing(part(cards.base));
    for (const [key, category] of Object.entries(cards.categories)) {
      const own = part(category);
      if (Object.keys(own).length > 0) {
        const selector = `[data-category=${attributeValue(key)}]`;
        style[slot === "root" ? `&${selector}` : `${selector} &`] = own;
      }
    }
    return themeStyle(style);
  };
  return {
    card: {
      base: {
        root: slot("root"),
        supertitle: slot("supertitle"),
        title: slot("title"),
        subtitle: slot("subtitle"),
        description: slot("description"),
        effect: slot("effect"),
      },
    },
  };
}

/**
 * A surface over the wallpaper: opaque, as V1 flattened them (`bgOpaque*`),
 * even on a translucent wallpaper.
 */
const onWallpaper = (surface: string) =>
  themeStyle({
    backgroundColor: `rgb(from var(${paletteVar("wallpaper")}) r g b / 1)`,
    backgroundImage: `linear-gradient(${surface} 0 0)`,
  });

/**
 * The parts on the solid surfaces, which a V1 palette doesn't have: on its
 * surfaces over the wallpaper. `fromV1.test.ts` checks that it has them all.
 */
function solidsFromV1(): ThemeCatalogue {
  const top = onWallpaper(`var(${paletteVar("surface")})`);
  const nested = onWallpaper(`var(${paletteVar("surfaceNested")})`);
  // a tint of a surface, as the catalogue mixes it with a solid one
  const tint = (
    color: Exclude<Tone, "neutral"> | "line",
    percent: number,
    surface: "surface" | "surfaceNested" = "surface",
  ) =>
    onWallpaper(
      `color-mix(in srgb, var(${paletteVar(color)}) ${percent}%, var(${paletteVar(surface)}))`,
    );
  return {
    surface: {
      compoundVariants: [
        { depth: "top", solid: true, css: top },
        { depth: "nested", solid: true, css: nested },
      ],
    },
    floating: { base: top },
    partyCell: {
      compoundVariants: [
        { odd: true, zero: false, header: true, css: top },
        { odd: false, zero: false, header: true, css: nested },
        { odd: true, zero: true, header: true, css: tint("danger", 50) },
        {
          odd: false,
          zero: true,
          header: true,
          css: tint("danger", 50, "surfaceNested"),
        },
      ],
    },
    dragHandle: { base: top },
    select: { base: nested },
    callout: {
      variants: {
        tone: Object.fromEntries(
          tones.map((tone) => [
            tone,
            tint(tone === "neutral" ? "line" : tone, 30),
          ]),
        ) as Record<Tone, ThemeStyle>,
      },
    },
  };
}

/**
 * The catalogue a V1 theme's styles become. `theme` is the seed as
 * `themeFactory` filled it in: V1's defaults for the fields a seed leaves
 * out are part of the V1 contract too, so they become overrides as well.
 */
export function catalogueFromV1(theme: ThemeV1): ThemeCatalogue {
  return {
    // over Foundry's own window
    ...(theme.appWindowStyle
      ? {
          appFrame: {
            base: { root: themeStyle(fromEmotion(theme.appWindowStyle)) },
          },
        }
      : {}),
    // V1 spread these over the root's defaults: a patch of the size variants
    sheetRoot: {
      variants: {
        size: {
          large: themeStyle(fromEmotion(theme.largeSheetRootStyle)),
          small: themeStyle(fromEmotion(theme.smallSheetRootStyle)),
        },
      },
    },
    ...logoFromV1(theme),
    ...cardsFromV1(theme),
    ...panelsFromV1(theme),
    ...tabsFromV1(theme),
    ...solidsFromV1(),
  };
}

/**
 * CSS without Emotion's labels (`label:name;`), which aren't CSS. Only real
 * declarations, matched as Emotion does: not the same text inside a string
 * or a comment, or a selector for `label` elements.
 */
function stripLabels(css: string) {
  let out = "";
  let quote: string | null = null;
  // at the start of a declaration (or a rule)
  let atStart = true;
  for (let i = 0; i < css.length; i++) {
    const char = css[i];
    if (quote) {
      out += char;
      if (char === "\\") out += css[++i] ?? "";
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      const stop = end === -1 ? css.length : end + 2;
      out += css.slice(i, stop);
      i = stop - 1;
      continue;
    }
    if (atStart && /\s/.test(char)) {
      out += char;
      continue;
    }
    // Emotion's own label pattern, so `label:hover {` (a selector) isn't one
    const label = atStart
      ? /^label:\s*[^\s;{]+\s*(;|$)/.exec(css.slice(i))
      : null;
    if (label) {
      i += label[0].length - 1;
      continue;
    }
    atStart = char === ";" || char === "{" || char === "}";
    if (char === '"' || char === "'") quote = char;
    out += char;
  }
  return out;
}

/** Emotion's serialised styles, as a V1 theme's `global` can be. */
type SerializedStyles = Exclude<ThemeV1["global"], string | undefined>;

/**
 * A V1 theme's `global` CSS (for `@import`ing fonts): a string, or Emotion's
 * serialised styles. Those can carry labels, and the keyframes they use
 * (`next`), which go after the styles: an `@import` has to come first.
 */
export function globalCssFromV1(global: ThemeV1["global"]) {
  if (!global) return "";
  if (typeof global === "string") return global;
  const parts: string[] = [];
  for (
    let serialized: SerializedStyles | undefined = global;
    serialized;
    serialized = serialized.next
  ) {
    parts.push(serialized.styles);
  }
  return stripLabels(parts.join("\n"));
}

/** A V1 theme (as `themeFactory` made it from its seed) as a V2 theme. */
export function themeFromV1(
  theme: ThemeV1,
  polarity: ThemePalette["polarity"],
): ThemeV2 {
  const globalCss = globalCssFromV1(theme.global);
  return {
    schemaVersion: "v2",
    displayName: theme.displayName,
    palette: paletteFromV1(theme, polarity),
    fonts: fontsFromV1(theme),
    catalogue: catalogueFromV1(theme),
    layout: "standard",
    ...(globalCss ? { globalCss } : {}),
  };
}
