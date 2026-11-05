import { describe, expect, test } from "vitest";

import { catalogueOverridesCss, layerOf } from "./overrides";

describe("layerOf", () => {
  test.each([
    ["badge", "system.recipes.base"],
    ["badge--tone_danger", "system.recipes.variants"],
    [
      "badge--compound__tone_danger__weight_strong",
      "system.recipes.compound_variants",
    ],
    ["card__title", "system.recipes.slots.base"],
    ["card__title--tone_danger", "system.recipes.slots.variants"],
  ])("%s is in %s", (name, layer) => {
    expect(layerOf(name)).toBe(layer);
  });
});

describe("catalogueOverridesCss", () => {
  test("replaces the default in its own layer, scoped to the theme", () => {
    expect(
      catalogueOverridesCss("teal", {
        badge: { borderRadius: 0, letterSpacing: "0.05em", lineHeight: 1.2 },
      }),
    ).toBe(
      [
        "@layer system.recipes.base {",
        '[data-inv-theme="teal"] .inv-badge { all: revert-layer; border-radius: 0; letter-spacing: 0.05em; line-height: 1.2; }',
        "}",
      ].join("\n"),
    );
  });

  test("nests selectors and at-rules without reverting again", () => {
    const css = catalogueOverridesCss("teal", {
      badge: {
        padding: 2,
        "&:hover": { color: "red" },
        "& > img": { width: "1em" },
        "@media (min-width: 40em)": { padding: 4 },
      },
    });
    expect(css).toContain(
      '[data-inv-theme="teal"] .inv-badge { all: revert-layer; padding: 2px; }',
    );
    expect(css).toContain(
      '[data-inv-theme="teal"] .inv-badge:hover { color: red; }',
    );
    expect(css).toContain(
      '[data-inv-theme="teal"] .inv-badge > img { width: 1em; }',
    );
    expect(css).toContain(
      '@media (min-width: 40em) { [data-inv-theme="teal"] .inv-badge { padding: 4px; } }',
    );
  });

  test("leaves custom properties as they are", () => {
    expect(
      catalogueOverridesCss("teal", { badge: { "--x-y": "1" } }),
    ).toContain("--x-y: 1;");
  });
});
