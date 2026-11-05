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

const scope = ':where([data-inv-theme="teal"]) .inv-badge';

describe("catalogueOverridesCss", () => {
  test("replaces the default in its own layer, scoped to the theme", () => {
    expect(
      catalogueOverridesCss("teal", {
        badge: { borderRadius: 0, letterSpacing: "0.05em", lineHeight: 1.2 },
      }),
    ).toBe(
      [
        "@layer system.recipes.base {",
        `${scope} { all: revert-layer; border-radius: 0; letter-spacing: 0.05em; line-height: 1.2; }`,
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
    expect(css).toContain(`${scope} { all: revert-layer; padding: 2px; }`);
    expect(css).toContain(`${scope}:hover { color: red; }`);
    expect(css).toContain(`${scope} > img { width: 1em; }`);
    expect(css).toContain(
      `@media (min-width: 40em) { ${scope} { padding: 4px; } }`,
    );
  });

  test("leaves custom properties as they are", () => {
    expect(
      catalogueOverridesCss("teal", { badge: { "--x-y": "1" } }),
    ).toContain("--x-y: 1;");
  });

  test("splits selector lists only on their top-level commas", () => {
    const css = catalogueOverridesCss("teal", {
      badge: { "&:is(:hover, :focus), & img": { color: "red" } },
    });
    expect(css).toContain(
      `${scope}:is(:hover, :focus), ${scope} img { color: red; }`,
    );
  });

  test("adds px only where React would", () => {
    const css = catalogueOverridesCss("teal", {
      badge: { aspectRatio: 2, scale: 1.1, columnCount: 2, "--n": 3, top: 4 },
    });
    expect(css).toContain(
      "aspect-ratio: 2; scale: 1.1; column-count: 2; --n: 3; top: 4px;",
    );
  });

  test("ignores anything that could escape its rule", () => {
    const css = catalogueOverridesCss("teal", {
      badge: {
        color: "red; } } p { color: blue; } /*",
        background: "url(x) /* y",
        "} p": { color: "blue" },
        padding: "1em",
      },
      "badge } p {": { color: "blue" },
    });
    expect(css).not.toContain(" p ");
    expect(css).not.toContain("/*");
    expect(css).toContain("padding: 1em;");
  });
});
