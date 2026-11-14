import type { ThemeSeedV1 } from "@lumphammer/investigator-fvtt-types";
import { describe, expect, test } from "vitest";

import { themeFactory } from "../functions";
import { mutantCityBlueTheme } from "../mutantCityBlueTheme";
import { niceTheme } from "../niceTheme";
import { niceThemeDark } from "../niceThemeDark";
import {
  catalogueFromV1,
  globalCssFromV1,
  paletteFromV1,
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

test.each([niceTheme, niceThemeDark, mutantCityBlueTheme])(
  "$displayName: the catalogue knows every name it makes",
  (theme) => {
    catalogueRules(catalogueFromV1(theme), (message) => {
      throw new Error(message);
    });
  },
);

describe("paletteFromV1", () => {
  test("maps V1 colours to their new names, the flattened ones to the solid surfaces", () => {
    const { colors } = niceTheme;
    expect(paletteFromV1(niceTheme)).toMatchObject({
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
  const depths = (overrides: Partial<ThemeSeedV1>) =>
    catalogue(overrides).panel?.variants?.depth;

  test("nothing, when a seed has no panel styles", () => {
    expect(catalogue().panel).toBeUndefined();
  });

  test("a primary style is for top panels, and nested ones without their own", () => {
    expect(depths({ panelStylePrimary: { backgroundColor: "red" } })).toEqual({
      top: { backgroundColor: "red" },
      nested: { backgroundColor: "red" },
    });
  });

  // V1's panel style replaced the background
  test("a secondary style is for nested panels; one without a background clears it", () => {
    expect(
      depths({
        panelStylePrimary: { border: "1px solid" },
        panelStyleSecondary: { boxShadow: "0 0 1px" },
      }),
    ).toEqual({
      top: { backgroundColor: "transparent", border: "1px solid" },
      nested: { backgroundColor: "transparent", boxShadow: "0 0 1px" },
    });
  });

  test("Emotion's selectors as CSS nesting has them, merged where they're the same", () => {
    expect(
      depths({
        panelStylePrimary: {
          background: "red",
          ":hover, :focus-within": { color: "red" },
          ":is(.a, .b) span": { color: "blue" },
          h1: { color: "red", fontSize: "1em" },
          "& h1": { fontSize: "2em" },
          "@media (min-width: 40em)": { padding: 4 },
          width: ["1em", "1lh"],
        },
      })?.top,
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

test("tabs replace the catalogue's, with V1's states as the tabs' attributes", () => {
  const { tab, spacer, content } = catalogue({
    tabStyle: { color: "red" },
    tabActiveStyle: { background: "white" },
    tabWrappedStyle: { borderRadius: "1em" },
    tabWrappedActiveStyle: { background: "grey" },
    tabSpacerStyle: { width: "1em" },
    tabContentStyle: { border: "1px solid" },
    tabContentWrappedStyle: { borderStyle: "dashed" },
  }).tabs!.base!;
  expect(tab).toMatchObject({
    all: "revert-layer",
    color: "red",
    "&[data-selected]:not([data-wrapped])": { background: "white" },
    "&[data-wrapped]": { borderRadius: "1em" },
    "&[data-selected][data-wrapped]": { background: "grey" },
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
