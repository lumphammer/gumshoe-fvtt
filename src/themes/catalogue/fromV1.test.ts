import type { ThemeSeedV1 } from "@lumphammer/investigator-fvtt-types";
import { describe, expect, test } from "vitest";

import { themeFactory } from "../functions";
import { mutantCityBlueTheme } from "../mutantCityBlueTheme";
import { highContrastTheme } from "../highContrastTheme";
import { fearTheme } from "../fearTheme";
import {
  catalogueFromV1,
  fontsFromV1,
  globalCssFromV1,
  paletteFromV1,
  parseFontShorthand,
  themeFromV1,
} from "./fromV1";
import { catalogueRules } from "./themeCss";

const seed: ThemeSeedV1 = {
  schemaVersion: "v1",
  displayName: "Test",
  largeSheetRootStyle: {},
  logo: {
    frontTextElementStyle: {},
    rearTextElementStyle: {},
    textElementsStyle: {},
    backdropStyle: {},
  },
  colors: {
    accent: "#962121",
    accentContrast: "white",
    glow: "#ff0000",
    wallpaper: "#ddd",
    backgroundSecondary: "rgba(255,255,255,0.2)",
    backgroundPrimary: "rgba(255,255,255,0.5)",
    backgroundButton: "rgba(0,0,0,0.1)",
    text: "#433",
    controlBorder: "#766",
  },
};

const catalogue = (overrides: Partial<ThemeSeedV1> = {}) =>
  catalogueFromV1(themeFactory({ ...seed, ...overrides }));

test.each([highContrastTheme, fearTheme, mutantCityBlueTheme])(
  "$displayName: the catalogue knows every name it makes",
  (theme) => {
    catalogueRules(catalogueFromV1(theme), (message) => {
      throw new Error(message);
    });
  },
);

describe("paletteFromV1", () => {
  test("maps V1 colours to their new names, the flattened ones to the solid surfaces", () => {
    const theme = themeFactory(seed);
    const { colors } = theme;
    expect(paletteFromV1(theme)).toMatchObject({
      polarity: "light",
      surface: colors.backgroundPrimary,
      surfaceNested: colors.backgroundSecondary,
      surfaceSolid: colors.bgOpaquePrimary,
      surfaceNestedSolid: colors.bgOpaqueSecondary,
      control: colors.backgroundButton,
      onAccent: colors.accentContrast,
      feedback: colors.glow,
      line: colors.controlBorder,
      cardGap: "0.5em 0.5em",
    });
  });

  test.each([
    ["#eee", "dark"],
    ["#433", "light"],
    // by lightness, for the colours Irid can't read
    ["oklch(0.9 0.02 80)", "dark"],
    ["oklch(25% 0.02 80)", "light"],
    ["lab(85 0 0)", "dark"],
    // not a colour it can read
    ["var(--some-text)", "light"],
  ])("text %s means a %s theme", (text, polarity) => {
    const theme = themeFactory({ ...seed, colors: { ...seed.colors, text } });
    expect(paletteFromV1(theme).polarity).toBe(polarity);
  });
});

describe("panels", () => {
  const bases = (overrides: Partial<ThemeSeedV1>) => {
    const { region, panel } = catalogue(overrides);
    return { region: region?.base, panel: panel?.base };
  };

  test("nothing, when a seed has no panel styles", () => {
    expect(bases({})).toEqual({ region: undefined, panel: undefined });
  });

  test("a primary style is for regions, and panels without their own", () => {
    expect(bases({ panelStylePrimary: { backgroundColor: "red" } })).toEqual({
      region: { backgroundColor: "red" },
      panel: { backgroundColor: "red" },
    });
  });

  // V1's panel style replaced the background
  test("a secondary style is for panels; one without a background clears it", () => {
    expect(
      bases({
        panelStylePrimary: { border: "1px solid" },
        panelStyleSecondary: { boxShadow: "0 0 1px" },
      }),
    ).toEqual({
      region: { backgroundColor: "transparent", border: "1px solid" },
      panel: { backgroundColor: "transparent", boxShadow: "0 0 1px" },
    });
  });

  test("a secondary style alone leaves regions as they are", () => {
    expect(bases({ panelStyleSecondary: { background: "red" } })).toEqual({
      region: undefined,
      panel: { background: "red" },
    });
  });

  test("Emotion's selectors as CSS nesting has them, merged where they're the same", () => {
    expect(
      bases({
        panelStylePrimary: {
          background: "red",
          ":hover, :focus-within": { color: "red" },
          ":is(.a, .b) span": { color: "blue" },
          h1: { color: "red", fontSize: "1em" },
          "& h1": { fontSize: "2em" },
          "@media (min-width: 40em)": { padding: 4 },
          width: ["1em", "1lh"],
        },
      }).region,
    ).toEqual({
      background: "red",
      "&:hover, &:focus-within": { color: "red" },
      "&:is(.a, .b) span": { color: "blue" },
      "& h1": { color: "red", fontSize: "2em" },
      "@media (min-width: 40em)": { padding: 4 },
      width: ["1em", "1lh"],
    });
  });
});

describe("fonts", () => {
  // what a `font` shorthand resets, when it doesn't say
  const reset = {
    weight: "normal",
    stretch: "normal",
    style: "normal",
    caps: "normal",
    lineHeight: "normal",
  };

  test("a font shorthand, taken apart", () => {
    expect(
      parseFontShorthand(
        "condensed normal small-caps 600 1.2em 'Saira', serif",
      ),
    ).toEqual({
      ...reset,
      stretch: "condensed",
      caps: "small-caps",
      weight: "600",
      size: "1.2em",
      family: "'Saira', serif",
    });
    expect(parseFontShorthand("italic bold 16px/1.75 Some Font")).toEqual({
      ...reset,
      style: "italic",
      weight: "bold",
      size: "16px",
      lineHeight: "1.75",
      family: "Some Font",
    });
    expect(parseFontShorthand("oblique 12deg 1em A")).toMatchObject({
      style: "oblique 12deg",
    });
    // a keyword size as a length, so it can go in a calc()
    expect(parseFontShorthand("small Averia")).toEqual({
      ...reset,
      size: "13px",
      family: "Averia",
    });
    expect(parseFontShorthand("larger Averia")?.size).toBe("1.2em");
    // a family alone isn't a `font` value, and a system font can't be taken
    // apart
    expect(parseFontShorthand("'Averia Libre', sans-serif")).toBeUndefined();
    expect(parseFontShorthand("caption")).toBeUndefined();
  });

  const fonts = (overrides: Partial<ThemeSeedV1>) =>
    fontsFromV1(themeFactory({ ...seed, ...overrides }));

  test("body's size is the base size; display's is its scale", () => {
    expect(
      fonts({
        bodyFont: "semi-condensed 500 16px 'Saira', sans-serif",
        displayFont: "condensed normal small-caps 600 1.2em 'Saira', serif",
        displayFontTextTransform: "uppercase",
      }),
    ).toEqual({
      baseSize: "16px",
      body: {
        ...reset,
        family: "'Saira', sans-serif",
        weight: "500",
        stretch: "semi-condensed",
      },
      display: {
        ...reset,
        family: "'Saira', serif",
        weight: "600",
        stretch: "condensed",
        caps: "small-caps",
        case: "uppercase",
        scale: 1.2,
      },
    });
  });

  test("a display size in pixels is a scale of a body size in pixels", () => {
    expect(
      fonts({ bodyFont: "16px A", displayFont: "20px B" }).display,
    ).toMatchObject({ family: "B", scale: 1.25 });
    expect(
      fonts({ bodyFont: "1em A", displayFont: "20px B" }).display,
    ).not.toHaveProperty("scale");
    expect(fonts({ displayFont: "110% B" }).display).toMatchObject({
      scale: 1.1,
    });
  });

  test("the theme has them", () => {
    expect(
      themeFromV1(themeFactory({ ...seed, bodyFont: "1.1em sans-serif" }))
        .fonts,
    ).toEqual({ baseSize: "1.1em", body: { ...reset, family: "sans-serif" } });
  });
});

test("tabs replace the catalogue's, with V1's selected styles as the tabs' selected state", () => {
  const { base, states } = catalogue({
    tabStyle: { color: "red", ":hover": { color: "blue" } },
    tabActiveStyle: { background: "white" },
    tabWrappedStyle: { borderRadius: "1em", backgroundColor: "pink" },
    tabWrappedActiveStyle: { background: "grey" },
    tabSpacerStyle: { width: "1em" },
    tabContentStyle: { border: "1px solid" },
    tabContentWrappedStyle: { borderStyle: "dashed" },
  }).tabs!;
  const { tab, spacer, content } = base!;
  expect(tab).toMatchObject({
    all: "revert-layer",
    color: "red",
    "&[data-wrapped]": { borderRadius: "1em", backgroundColor: "pink" },
  });
  // from nothing (the tab's own look, not the catalogue's selected one),
  // then V1's active styles
  expect(states?.selected?.tab).toEqual({
    all: "revert-layer",
    "&:not([data-wrapped])": { background: "white" },
    "&[data-wrapped]": { background: "grey" },
  });
  expect(states?.disabled?.tab).toEqual({
    "&:hover": { textShadow: "none" },
  });
  expect(spacer).toEqual({ all: "revert-layer", width: "1em" });
  expect(content).toEqual({
    all: "revert-layer",
    padding: "0.5em",
    border: "1px solid",
    "&[data-wrapped]": { borderStyle: "dashed" },
  });
});

test("the sheet root's styles patch its size variants", () => {
  expect(
    catalogue({
      largeSheetRootStyle: { fontSize: "1.1em" },
      smallSheetRootStyle: { ":before": { content: "''" } },
    }).sheetRoot?.variants?.size,
  ).toEqual({
    large: {
      backgroundSize: "cover",
      backgroundPosition: "center",
      fontSize: "1.1em",
    },
    small: { "&:before": { content: "''" } },
  });
});

test("a window style goes on the app frame", () => {
  expect(
    catalogue({ appWindowStyle: { boxShadow: "0 0 20px red" } }).appFrame,
  ).toEqual({ base: { root: { boxShadow: "0 0 20px red" } } });
});

test("the logo's styles go over each part's defaults; text size and rear colour where they are now", () => {
  const logo = catalogue({
    logo: {
      backdropStyle: { background: "red" },
      textElementsStyle: { fontSize: "2em" },
      frontTextElementStyle: { color: "gold" },
      rearTextElementWrapperStyle: { color: "grey" },
      rearTextElementStyle: { textShadow: "1px 1px black" },
    },
  }).logo!.base!;
  expect(logo.backdrop).toEqual({ background: "red" });
  // 4em is inherited now
  expect(logo.text).toMatchObject({ fontSize: "calc(2em / 4)" });
  expect(logo.front).toEqual({ padding: "0 1em", color: "gold" });
  expect(logo.front_sub).toMatchObject({ fontSize: "0.5em", color: "gold" });
  // the rear wrapper's text is always transparent: its colour moves
  expect(logo.rear_sub).toMatchObject({
    color: "grey",
    textShadow: "1px 1px black",
  });
});

describe("cards", () => {
  test("a part's base style replaces its defaults whole, as V1's factory did", () => {
    const card = catalogue({
      cards: { base: { subtitleStyle: { color: "blue" } } },
    }).card!.base!;
    expect(card.subtitle).toEqual({ all: "revert-layer", color: "blue" });
    expect(card.effect).toEqual({ all: "revert-layer", fontStyle: "italic" });
    expect(card.root).toMatchObject({
      "&.investigator-card-array-card:hover": {
        boxShadow: "0 0 0.3em 0.2em #ff0000",
      },
    });
  });

  test("a category patches the base, on the root's data-category, escaped", () => {
    const card = catalogue({
      cards: {
        base: { titleStyle: { color: "red" } },
        categories: {
          stress: { backdropStyle: { color: "blue" } },
          "mental stress": { titleStyle: { color: "blue" } },
        },
      },
    }).card!.base!;
    expect(card.title).toEqual({
      all: "revert-layer",
      color: "red",
      '[data-category="mental\\20 stress"] &': { color: "blue" },
    });
    expect(card.root).toHaveProperty('&[data-category="stress"]', {
      color: "blue",
    });
  });
});

describe("globalCssFromV1", () => {
  const fontImport = "@import url('https://example.com/font.css');";

  test("a string is used as it is, and goes on the theme", () => {
    expect(globalCssFromV1(fontImport)).toBe(fontImport);
    expect(
      themeFromV1(themeFactory({ ...seed, global: fontImport })).globalCss,
    ).toBe(fontImport);
  });

  // what Emotion's `css` tag made of a labelled style composed with another
  test("only Emotion's real labels go: not text in strings or comments", () => {
    expect(
      globalCssFromV1({
        name: "x",
        styles: `label:a;label:b;${fontImport}.x{label:c;content:"a;label:visible;"}/* label:d; */`,
      }),
    ).toBe(`${fontImport}.x{content:"a;label:visible;"}/* label:d; */`);
  });

  test("a selector for label elements isn't a label", () => {
    const styles = "label:hover{color:red}.x{label:hover {color:blue}}";
    expect(globalCssFromV1({ name: "x", styles })).toBe(styles);
  });

  // what Emotion made of styles using its `keyframes`: linked on as `next`
  test("keyframes come along, after the styles, so an @import stays first", () => {
    const out = globalCssFromV1({
      name: "x",
      styles: `${fontImport}body{animation:spin 2s infinite;}`,
      next: { name: "spin", styles: "@keyframes spin{to{rotate:1turn;}}" },
    });
    expect(out.startsWith("@import")).toBe(true);
    expect(out).toContain("@keyframes spin");
  });
});
