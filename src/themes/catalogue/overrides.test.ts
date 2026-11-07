import { describe, expect, test } from "vitest";

import {
  catalogueOverridesCss,
  escapeStrings,
  isSafeValue,
  layerOf,
} from "./overrides";

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

const root = '[data-inv-theme="teal"]';
const scope = `.inv-badge:where(${root}, ${root} *)`;

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

  test("lets context go either side of the class, in the root or outside it", () => {
    const css = catalogueOverridesCss("teal", {
      tabs__tab: {
        color: "red",
        "input:checked + &": { color: "blue" },
        "[data-wrapped] > &, &:hover": { color: "green" },
        ".compact &": { color: "grey" },
      },
    });
    const tab = `.inv-tabs__tab:where(${root}, ${root} *)`;
    expect(css).toContain(`input:checked + ${tab} { color: blue; }`);
    expect(css).toContain(
      `[data-wrapped] > ${tab}, ${tab}:hover { color: green; }`,
    );
    expect(css).toContain(`.compact ${tab} { color: grey; }`);
  });

  test("patches a variant rather than replacing it, so the element's other variants survive", () => {
    const css = catalogueOverridesCss("teal", {
      "row--interactive_true": { cursor: "crosshair" },
      "badge--compound__tone_danger__weight_strong": { color: "red" },
      card__title: { color: "blue" },
    });
    expect(css).toContain(
      `.inv-row--interactive_true:where(${root}, ${root} *) { cursor: crosshair; }`,
    );
    expect(css).toContain("{ color: red; }");
    expect(css).not.toMatch(/interactive_true[^{]*\{ all: revert-layer/);
    expect(css).not.toMatch(/weight_strong[^{]*\{ all: revert-layer/);
    // a slot is still replaced
    expect(css).toMatch(
      /card__title[^{]*\{ all: revert-layer; color: blue; \}/,
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

describe("isSafeValue", () => {
  test.each([
    'url("data:image/svg+xml;base64,PHN2Zy8+")',
    "url(data:image/png;base64,AAAA)",
    "url('a{b}.svg')",
    '"a; b"',
    "1px solid red",
    "linear-gradient(to top, #fff 0%, #000 10%)",
  ])("allows %s", (value) => {
    expect(isSafeValue(value)).toBe(true);
  });

  test.each([
    "red; } p { color: blue",
    "red }",
    "url(x) /* y",
    "a */ b",
    '"unclosed',
    "url(open",
    '"</style>"',
    '"a\nb"',
  ])("rejects %s", (value) => {
    expect(isSafeValue(value)).toBe(false);
  });
});

describe("values", () => {
  test("a list of fallbacks becomes one declaration each, in order", () => {
    expect(
      catalogueOverridesCss("teal", {
        badge: { width: ["200px", "1lh"] as unknown as string },
      }),
    ).toContain("width: 200px; width: 1lh;");
  });

  test("an inline SVG in a data URL is kept, with its < escaped", () => {
    const svg = `url("data:image/svg+xml,<svg xmlns='x'></svg>")`;
    const css = catalogueOverridesCss("teal", {
      badge: { backgroundImage: svg },
    });
    expect(css).not.toContain("</");
    expect(css).toContain(
      "background-image: url(\"data:image/svg+xml,\\3c svg xmlns='x'>\\3c /svg>\");",
    );
  });

  test("escapeStrings only touches quoted strings", () => {
    expect(escapeStrings(`a<b "c<d" 'e<f'`)).toBe(`a<b "c\\3c d" 'e\\3c f'`);
  });
});
