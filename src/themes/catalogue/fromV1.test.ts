import { describe, expect, test } from "vitest";

import { mutantCityBlueTheme } from "../mutantCityBlueTheme";
import { tealTheme } from "../tealTheme";
import { catalogueFromV1 } from "./fromV1";

const seed = {
  ...tealTheme,
  panelStylePrimary: undefined,
  panelStyleSecondary: undefined,
};

describe("catalogueFromV1", () => {
  test("nothing, when a seed has no panel styles", () => {
    expect(catalogueFromV1(seed)).toEqual({});
  });

  test("a primary panel style goes over the panel's defaults", () => {
    expect(
      catalogueFromV1({ ...seed, panelStylePrimary: { border: "1px solid" } }),
    ).toEqual({
      panel: {
        background: "var(--inv-surface)",
        padding: "0.5em",
        border: "1px solid",
      },
    });
  });

  test("a secondary panel style is for nested panels", () => {
    expect(
      catalogueFromV1({
        ...seed,
        panelStyleSecondary: { backgroundColor: "red" },
      }),
    ).toEqual({
      "panel--depth_nested": {
        background: "var(--inv-surface-nested)",
        backgroundColor: "red",
      },
    });
  });

  test("Emotion's pseudo-classes attach to the element", () => {
    expect(
      catalogueFromV1({
        ...seed,
        panelStyleSecondary: {
          ":hover": { color: "red" },
          "& > img": { width: ["1em", "1lh"] },
        },
      })["panel--depth_nested"],
    ).toMatchObject({
      "&:hover": { color: "red" },
      "& > img": { width: "1lh" },
    });
  });
});

test("themes get their V1 panel styles as overrides", () => {
  expect(mutantCityBlueTheme.catalogue?.["panel"]).toMatchObject({
    border: expect.stringMatching(/^1px solid/),
  });
  expect(tealTheme.catalogue).toBeUndefined();
});
