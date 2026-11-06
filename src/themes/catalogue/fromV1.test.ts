import { describe, expect, test } from "vitest";

import { mutantCityBlueTheme } from "../mutantCityBlueTheme";
import { tealTheme } from "../tealTheme";
import { catalogueFromV1 } from "./fromV1";
import { catalogueOverridesCss } from "./overrides";

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
};

const fromV1 = (seed: Parameters<typeof catalogueFromV1>[0]) =>
  catalogueFromV1(seed, tealTheme);

describe("catalogueFromV1", () => {
  test("nothing, when a seed has no panel styles", () => {
    expect(fromV1(seed)).toEqual({});
  });

  test("a primary panel style is for top panels, and nested ones without their own", () => {
    expect(
      fromV1({
        ...seed,
        panelStylePrimary: { backgroundColor: "red", border: "1px solid" },
      }),
    ).toEqual({
      panel: { padding: "0.5em" },
      "panel--depth_top": { backgroundColor: "red", border: "1px solid" },
      "panel--depth_nested": { backgroundColor: "red", border: "1px solid" },
    });
  });

  test("a secondary panel style is for nested panels only", () => {
    expect(
      fromV1({
        ...seed,
        panelStylePrimary: { border: "1px solid" },
        panelStyleSecondary: { boxShadow: "0 0 1px" },
      }),
    ).toEqual({
      panel: { padding: "0.5em" },
      "panel--depth_top": { border: "1px solid" },
      "panel--depth_nested": { boxShadow: "0 0 1px" },
    });
  });

  test("without a primary style, top panels keep the default surface", () => {
    expect(
      fromV1({ ...seed, panelStyleSecondary: { color: "red" } })[
        "panel--depth_top"
      ],
    ).toEqual({ background: "var(--inv-surface)" });
  });

  test("Emotion's pseudo-classes attach to the element, in selector lists too", () => {
    const overrides = fromV1({
      ...seed,
      panelStyleSecondary: {
        ":hover, :focus-within": { color: "red" },
        "& > img": { width: ["1em", "1lh"] },
        ":is(.a, .b) span": { color: "blue" },
        "@media (min-width: 40em)": { padding: 4 },
      },
    });
    expect(overrides["panel--depth_nested"]).toEqual({
      "&:hover, &:focus-within": { color: "red" },
      "& > img": { width: "1lh" },
      "&:is(.a, .b) span": { color: "blue" },
      "@media (min-width: 40em)": { padding: 4 },
    });
    const scope = ':where([data-inv-theme="t"]) .inv-panel--depth_nested';
    expect(catalogueOverridesCss("t", overrides)).toContain(
      `${scope}:hover, ${scope}:focus-within { color: red; }`,
    );
  });
});

describe("tabs", () => {
  test("nothing, when a seed has no tab styles", () => {
    expect(Object.keys(fromV1(seed))).toEqual([]);
  });

  test("a seed's tab styles become the tabs slots, with V1's states", () => {
    const overrides = catalogueFromV1(
      { ...seed, tabStyle: { color: "red", ":hover": { color: "blue" } } },
      {
        ...tealTheme,
        tabStyle: { color: "red", ":hover": { color: "blue" } },
        tabActiveStyle: { background: "white" },
        tabWrappedStyle: { borderRadius: "1em" },
        tabWrappedActiveStyle: { background: "grey" },
        tabSpacerStyle: { width: "1em" },
        tabContentStyle: { border: "1px solid" },
        tabContentWrappedStyle: { borderStyle: "dashed" },
      },
    );
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
  expect(mutantCityBlueTheme.catalogue?.["panel--depth_top"]).toMatchObject({
    border: expect.stringMatching(/^1px solid/),
  });
  expect(mutantCityBlueTheme.catalogue?.["tabs__tab"]).toBeDefined();
  expect(tealTheme.catalogue).toBeUndefined();
});
