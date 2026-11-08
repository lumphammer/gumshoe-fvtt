import { describe, expect, test } from "vitest";

import { mutantCityBlueTheme } from "../v1/mutantCityBlueTheme";
import { tealTheme } from "../v1/tealTheme";
import { themeFactory } from "../functions";
import { compileCatalogue } from "./compileCatalogue";
import { catalogueFromV1 } from "./fromV1";
import { catalogueOverridesCss } from "./overrides";

/**
 * A V1 theme's catalogue, compiled to overrides by class (as `themeFromV1`
 * does): a warning fails the test, as `fromV1` should only make what fits.
 */
const compiled = (theme: Parameters<typeof catalogueFromV1>[0]) =>
  compileCatalogue(
    catalogueFromV1(theme),
    (message) => {
      throw new Error(message);
    },
    { literal: true },
  );

const seed = {
  ...tealTheme,
  panelStylePrimary: undefined,
  panelStyleSecondary: undefined,
  tabStyle: undefined,
  tabActiveStyle: undefined,
  tabSpacerStyle: undefined,
  tabContentStyle: undefined,
  tabWrappedStyle: undefined,
  tabWrappedActiveStyle: undefined,
  tabContentWrappedStyle: undefined,
  cards: undefined,
};

const theme = themeFactory(seed);

/** The panel overrides, from a theme. */
const fromV1 = (theme: Parameters<typeof catalogueFromV1>[0]) =>
  Object.fromEntries(
    Object.entries(compiled(theme)).filter(([name]) =>
      name.startsWith("panel"),
    ),
  );

describe("catalogueFromV1", () => {
  test("nothing, when a seed has no panel styles", () => {
    expect(fromV1(theme)).toEqual({});
  });

  test("a primary panel style is for top panels, and nested ones without their own", () => {
    expect(
      fromV1({
        ...theme,
        panelStylePrimary: { backgroundColor: "red", border: "1px solid" },
      }),
    ).toEqual({
      panel: { padding: "0.5em" },
      "panel--depth_top": { backgroundColor: "red", border: "1px solid" },
      "panel--depth_nested": { backgroundColor: "red", border: "1px solid" },
    });
  });

  // V1's panel style replaced the background, so one without a background
  // leaves the panel transparent
  test("a secondary panel style is for nested panels only", () => {
    expect(
      fromV1({
        ...theme,
        panelStylePrimary: { border: "1px solid" },
        panelStyleSecondary: { boxShadow: "0 0 1px" },
      }),
    ).toEqual({
      panel: { padding: "0.5em" },
      "panel--depth_top": {
        border: "1px solid",
        backgroundColor: "transparent",
      },
      "panel--depth_nested": {
        boxShadow: "0 0 1px",
        backgroundColor: "transparent",
      },
    });
  });

  test("a panel style's own backgrounds keep their order", () => {
    // the shorthand comes last, so it wins, as it did in V1
    expect(
      fromV1({
        ...theme,
        panelStylePrimary: { backgroundColor: "red", background: "blue" },
      })["panel--depth_top"],
    ).toEqual({ backgroundColor: "red", background: "blue" });
  });

  test("without a primary style, top panels keep the default surface", () => {
    expect(
      fromV1({ ...theme, panelStyleSecondary: { color: "red" } })[
        "panel--depth_top"
      ],
    ).toEqual({ background: "var(--inv-surface)" });
  });

  test("Emotion's pseudo-classes attach to the element, in selector lists too", () => {
    const overrides = fromV1({
      ...theme,
      panelStyleSecondary: {
        ":hover, :focus-within": { color: "red" },
        "& > img": { width: ["1em", "1lh"] },
        ":is(.a, .b) span": { color: "blue" },
        "@media (min-width: 40em)": { padding: 4 },
        // a descendant, as Emotion has it
        "h1, h2": { color: "red" },
      },
    });
    expect(overrides["panel--depth_nested"]).toEqual({
      "&:hover, &:focus-within": { color: "red" },
      "& > img": { width: ["1em", "1lh"] },
      "&:is(.a, .b) span": { color: "blue" },
      "@media (min-width: 40em)": { padding: 4 },
      "& h1, & h2": { color: "red" },
      backgroundColor: "transparent",
    });
    const root = '[data-inv-theme="t"]';
    const scope = `.inv-panel--depth_nested:where(${root}, ${root} *)`;
    expect(catalogueOverridesCss("t", overrides)).toContain(
      `${scope}:hover, ${scope}:focus-within { color: red; }`,
    );
  });
});

test("a bare selector and its & form are one rule, the later over the earlier", () => {
  expect(
    fromV1({
      ...theme,
      panelStylePrimary: {
        backgroundColor: "red",
        h1: { color: "red", fontSize: "1em" },
        "& h1": { fontSize: "2em" },
        "@media (min-width: 40em)": {
          h2: { color: "red" },
          "& h2": { margin: 0 },
        },
      },
    })["panel--depth_top"],
  ).toEqual({
    backgroundColor: "red",
    "& h1": { color: "red", fontSize: "2em" },
    "@media (min-width: 40em)": { "& h2": { color: "red", margin: 0 } },
  });
});

test("a V1 theme's values are CSS as written, even a palette name", () => {
  expect(
    fromV1({ ...theme, panelStylePrimary: { color: ["red", "text"] } })[
      "panel--depth_top"
    ],
  ).toMatchObject({ color: ["red", "text"] });
});

describe("tabs", () => {
  test("a seed without tab styles gets V1's default tabs", () => {
    const { colors } = tealTheme;
    const overrides = compiled(theme);
    expect(overrides["tabs__tab"]).toMatchObject({
      background: colors.backgroundSecondary,
      color: colors.accent,
      "&:hover": { textShadow: `0 0 0.3em ${colors.glow}` },
      ":not([data-wrapped]) > input:checked + &": {
        background: colors.backgroundPrimary,
      },
      "input:disabled + &:hover": { textShadow: "none" },
    });
    expect(overrides["tabs__spacer"]).toEqual({ width: "0.5em" });
    expect(overrides["tabs__content"]).toMatchObject({
      backgroundColor: colors.backgroundPrimary,
    });
  });

  test("a theme's tab styles become the tabs slots, with V1's states", () => {
    const overrides = compiled({
      ...tealTheme,
      tabStyle: { color: "red", ":hover": { color: "blue" } },
      tabActiveStyle: { background: "white" },
      tabWrappedStyle: { borderRadius: "1em" },
      tabWrappedActiveStyle: { background: "grey" },
      tabSpacerStyle: { width: "1em" },
      tabContentStyle: { border: "1px solid" },
      tabContentWrappedStyle: { borderStyle: "dashed" },
    });
    expect(overrides["tabs__tab"]).toMatchObject({
      color: "red",
      "&:hover": { color: "blue" },
      ":not([data-wrapped]) > input:checked + &": { background: "white" },
      "[data-wrapped] > &": { borderRadius: "1em" },
      "[data-wrapped] > input:checked + &": { background: "grey" },
    });
    expect(overrides["tabs__spacer"]).toEqual({ width: "1em" });
    expect(overrides["tabs__content"]).toEqual({
      padding: "0.5em",
      border: "1px solid",
      "[data-wrapped] + &": { borderStyle: "dashed" },
    });
  });
});

test("themes get their V1 panel styles as overrides", () => {
  expect(compiled(mutantCityBlueTheme)["panel--depth_top"]).toMatchObject({
    border: expect.stringMatching(/^1px solid/),
  });
  expect(compiled(mutantCityBlueTheme)["tabs__tab"]).toBeDefined();
  expect(Object.keys(compiled(tealTheme))).toEqual([
    "sheet-root--size_large",
    "sheet-root--size_small",
    "logo__backdrop",
    "logo__text",
    "logo__front_wrapper",
    "logo__front",
    "logo__front_sub",
    "logo__rear_wrapper",
    "logo__rear",
    "logo__rear_sub",
    "surface--depth_top.surface--solid_true",
    "surface--depth_nested.surface--solid_true",
    "floating",
    "party-cell--header_true.party-cell--odd_true.party-cell--zero_false",
    "party-cell--header_true.party-cell--odd_false.party-cell--zero_false",
    "party-cell--header_true.party-cell--odd_true.party-cell--zero_true",
    "party-cell--header_true.party-cell--odd_false.party-cell--zero_true",
    "party-cell--header_false.party-cell--odd_true.party-cell--zero_true",
    "party-cell--header_false.party-cell--odd_false.party-cell--zero_true",
    "select",
    "drag-handle",
    "callout--tone_neutral",
    "callout--tone_danger",
    "callout--tone_warning",
    "callout--tone_success",
    "callout--tone_info",
    "card__root",
    "card__supertitle",
    "card__title",
    "card__subtitle",
    "card__description",
    "card__effect",
    "tabs__tab",
    "tabs__spacer",
    "tabs__content",
  ]);
});

test("things that overlap content are on V1's flattened surfaces, and danger tints are V1's", () => {
  const { colors } = tealTheme;
  const overrides = compiled(tealTheme);
  expect(overrides["surface--depth_top.surface--solid_true"]).toEqual({
    backgroundColor: colors.bgOpaquePrimary,
  });
  expect(overrides["floating"]).toEqual({ background: colors.bgOpaquePrimary });
  expect(
    overrides[
      "party-cell--header_true.party-cell--odd_false.party-cell--zero_true"
    ],
  ).toEqual({ background: colors.bgOpaqueDangerSecondary });
  // and V1's danger tint, which kept the surface's opacity
  expect(
    overrides[
      "party-cell--header_false.party-cell--odd_true.party-cell--zero_true"
    ],
  ).toEqual({ background: colors.bgTransDangerPrimary });
  // a base override replaces the default, so it restates the rest of it
  expect(overrides["select"]).toMatchObject({
    borderStyle: "solid",
    background: colors.bgOpaqueSecondary,
    "& option": { background: colors.bgOpaquePrimary },
  });
  expect(overrides["drag-handle"]).toMatchObject({
    cursor: "n-resize",
    background: colors.bgOpaquePrimary,
  });
  expect(overrides["callout--tone_danger"]).toEqual({
    background: `color-mix(in srgb, var(--inv-danger) 30%, ${colors.bgOpaquePrimary})`,
  });
  // the overrides are all for names the catalogue has
  expect(catalogueOverridesCss("t", overrides)).toContain(
    ".inv-party-cell--header_true:where(.inv-party-cell--odd_false.inv-party-cell--zero_true)",
  );
});

test("a theme's sheet root styles patch the root's size variants", () => {
  const overrides = compiled({
    ...tealTheme,
    largeSheetRootStyle: { backgroundImage: "url(a.webp)", fontSize: "1.1em" },
    smallSheetRootStyle: { ":before": { content: "''" } },
  });
  expect(overrides["sheet-root--size_large"]).toEqual({
    backgroundImage: "url(a.webp)",
    fontSize: "1.1em",
  });
  expect(overrides["sheet-root--size_small"]).toEqual({
    "&:before": { content: "''" },
  });
});

test("a theme's logo styles go over each part's defaults, as in V1", () => {
  const overrides = compiled({
    ...tealTheme,
    logo: {
      backdropStyle: { background: "red" },
      textElementsStyle: { transform: "rotateY(-30deg)" },
      frontTextElementStyle: { color: "gold" },
      rearTextElementStyle: { textShadow: "1px 1px black" },
    },
  });
  expect(overrides["logo__backdrop"]).toEqual({ background: "red" });
  expect(overrides["logo__text"]).toMatchObject({
    fontSize: "1em",
    transform: "rotateY(-30deg)",
  });
  // the layout is LogoEditable's
  expect(overrides["logo__text"]).not.toHaveProperty("position");
  // the front style goes on the name and the subtext alike
  expect(overrides["logo__front"]).toEqual({ padding: "0 1em", color: "gold" });
  expect(overrides["logo__front_sub"]).toMatchObject({
    fontSize: "0.5em",
    color: "gold",
  });
  expect(overrides["logo__rear_sub"]).toMatchObject({
    textShadow: "1px 1px black",
  });
});

test("the logo's layout stays LogoEditable's, even against !important", () => {
  const overrides = compiled({
    ...tealTheme,
    logo: {
      ...tealTheme.logo,
      backdropStyle: { position: "fixed !important" as "fixed", width: "150%" },
      rearTextElementWrapperStyle: {
        zIndex: "1 !important",
        border: "1px solid",
      },
    },
  });
  // the backdrop's position is layout; its size is the theme's
  expect(overrides["logo__backdrop"]).toEqual({ width: "150%" });
  expect(overrides["logo__rear_wrapper"]).toEqual({ border: "1px solid" });
});

test("a V1 logo's text size and rear colour, where they are now", () => {
  const overrides = compiled({
    ...tealTheme,
    logo: {
      ...tealTheme.logo,
      textElementsStyle: { fontSize: "2em" },
      rearTextElementWrapperStyle: { color: "gold" },
      rearTextElementStyle: { textShadow: "1px 1px black" },
    },
  });
  // 4em is inherited now
  expect(overrides["logo__text"]).toMatchObject({ fontSize: "calc(2em / 4)" });
  // the rear wrapper's text is always transparent
  expect(overrides["logo__rear_wrapper"]).toEqual({});
  expect(overrides["logo__rear"]).toMatchObject({
    color: "gold",
    textShadow: "1px 1px black",
  });
  expect(overrides["logo__rear_sub"]).toMatchObject({ color: "gold" });
});

describe("cards", () => {
  const withCards = (cards: object) => {
    const seed2 = { ...seed, cards } as Parameters<typeof themeFactory>[0];
    return compiled(themeFactory(seed2));
  };

  test("a seed that doesn't style its cards gets V1's defaults", () => {
    const overrides = compiled(theme);
    expect(overrides["card__root"]).toMatchObject({
      padding: "0.5em",
      "&.investigator-card-array-card:hover": {
        boxShadow: `0 0 0.3em 0.2em ${tealTheme.colors.glow}`,
      },
    });
    expect(overrides["card__subtitle"]).toEqual({ fontWeight: "bold" });
  });

  test("a part's base style replaces its defaults whole, as V1's factory did", () => {
    const overrides = withCards({ base: { subtitleStyle: { color: "blue" } } });
    // not bold any more: the default subtitle style was replaced
    expect(overrides["card__subtitle"]).toEqual({ color: "blue" });
    // the parts it didn't style keep their defaults
    expect(overrides["card__effect"]).toEqual({ fontStyle: "italic" });
  });

  test("a category is its own rule, spread over the base, and the base leaves its cards out", () => {
    const overrides = withCards({
      base: {
        titleStyle: { color: "red !important", ":hover": { color: "red" } },
      },
      categories: { stress: { titleStyle: { color: "blue" } } },
    });
    const notStress =
      ':where(.inv-card__root:is(:not([data-category="stress"]))) &';
    const stress = ':where(.inv-card__root:is([data-category="stress"])) &';
    expect(overrides["card__title"]).toEqual({
      [notStress]: { color: "red !important", "&:hover": { color: "red" } },
      // V1: the category's colour replaced the base's, important or not
      [stress]: { color: "blue", "&:hover": { color: "red" } },
    });
    expect(overrides["card__root"]).toHaveProperty(
      '&:where([data-category="stress"])',
    );
  });

  test("any style key works: it's escaped in the attribute selector", () => {
    const overrides = withCards({
      categories: { "mental stress": { titleStyle: { color: "blue" } } },
    });
    expect(Object.keys(overrides["card__title"])).toContain(
      ':where(.inv-card__root:is([data-category="mental\\20 stress"])) &',
    );
  });
});

test("a theme's window style goes on the frame, scoped to the window", () => {
  const overrides = compiled({
    ...tealTheme,
    appWindowStyle: { boxShadow: "0 0 20px red" },
  });
  expect(overrides["app-frame__root"]).toEqual({ boxShadow: "0 0 20px red" });
  expect(catalogueOverridesCss("t", overrides)).toContain(
    '.inv-app-frame__root:where([data-inv-frame="t"], [data-inv-frame="t"] *)',
  );
});
