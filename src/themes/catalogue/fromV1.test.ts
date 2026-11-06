import { describe, expect, test } from "vitest";

import { mutantCityBlueTheme } from "../mutantCityBlueTheme";
import { tealTheme } from "../tealTheme";
import { catalogueFromV1 } from "./fromV1";
import { catalogueOverridesCss } from "./overrides";

const seed = {
  ...tealTheme,
  panelStylePrimary: undefined,
  panelStyleSecondary: undefined,
};

describe("catalogueFromV1", () => {
  test("nothing, when a seed has no panel styles", () => {
    expect(catalogueFromV1(seed)).toEqual({});
  });

  test("a primary panel style is for top panels, and nested ones without their own", () => {
    expect(
      catalogueFromV1({
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
      catalogueFromV1({
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
      catalogueFromV1({ ...seed, panelStyleSecondary: { color: "red" } })[
        "panel--depth_top"
      ],
    ).toEqual({ background: "var(--inv-surface)" });
  });

  test("Emotion's pseudo-classes attach to the element, in selector lists too", () => {
    const overrides = catalogueFromV1({
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

test("themes get their V1 panel styles as overrides", () => {
  expect(mutantCityBlueTheme.catalogue?.["panel--depth_top"]).toMatchObject({
    border: expect.stringMatching(/^1px solid/),
  });
  expect(tealTheme.catalogue).toBeUndefined();
});
