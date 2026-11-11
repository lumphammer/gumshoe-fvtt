import { describe, expect, test, vi } from "vitest";

import {
  type CatalogueOverrides,
  catalogueOverridesCss as renderOverrides,
  escapeStrings,
  isSafeValue,
  layerOf,
  notInOtherTheme,
  onSubject,
} from "./overrides";

/**
 * The CSS for a theme's overrides, without the theme's boundary
 * (`notInOtherTheme`), which goes on every rule's subject: where it goes is
 * tested on its own.
 */
const catalogueOverridesCss = (slug: string, overrides: CatalogueOverrides) =>
  renderOverrides(slug, overrides).replaceAll(
    notInOtherTheme(`[data-inv-theme="${slug}"]`),
    "",
  );

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

  test("leaves an & in a quoted attribute value alone", () => {
    const css = catalogueOverridesCss("teal", {
      badge: { '&[data-mark="a&b"]': { color: "red" } },
    });
    expect(css).toContain(`${scope}[data-mark="a&b"] { color: red; }`);
    // nor an escaped one
    expect(
      catalogueOverridesCss("teal", {
        badge: { "& .a\\&b": { color: "red" } },
      }),
    ).toContain(`${scope} .a\\&b { color: red; }`);
    // an escaped quote doesn't end the string, so its comma doesn't split
    const escaped = catalogueOverridesCss("teal", {
      badge: { '&[data-mark="a\\"],&b"]': { color: "red" } },
    });
    expect(escaped).toContain(`${scope}[data-mark="a\\"],&b"] { color: red; }`);
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
  test("a state override on a class: focus on what stands for a hidden input too", () => {
    const css = catalogueOverridesCss("teal", {
      "tabs__tab:focusRing": { outlineColor: "red" },
    });
    const tab = `.inv-tabs__tab:where(${root}, ${root} *)`;
    expect(css).toContain(
      `@layer system.states.focus {\n${tab}:focus-visible, input:focus-visible + ${tab}:is(label, span) { outline-color: red; }`,
    );
  });

  test("a state that doesn't exist, or a name that's only a colon, is no class", () => {
    const warn = vi.spyOn(console, "warn").mockReturnValue(undefined);
    expect(
      catalogueOverridesCss("teal", {
        ":pressed": { color: "red" },
        "badge:pressed": { color: "red" },
        ":": { color: "red" },
      }),
    ).toBe("");
    expect(warn).toHaveBeenCalledTimes(3);
    warn.mockRestore();
  });
});

describe("isSafeValue", () => {
  test.each([
    'url("data:image/svg+xml;base64,PHN2Zy8+")',
    "url(data:image/png;base64,AAAA)",
    "url('a{b}.svg')",
    '"a; b"',
    '"\\201C"',
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
    // CSS ends a string at any newline
    '"a\rb"',
    '"a\fb"',
    // a quote in an unquoted url makes a bad url, which ends at the next ")"
    'url(x";) } } .victim { color: red; } /*")',
    "url(x(\\)) } .victim {",
    // an escape outside a string: an escaped quote, or a disguised url(
    'a\\"; } .victim { color: red; } "',
    '\\75rl(x";) } } .victim { color: red; } /*")',
    // `xurl(` is an ordinary function, so its comment is a comment
    'xurl(/*) "*/) ; } } .victim { color: red; } /*" url(*/)',
    // CSS doesn't count a non-breaking space as whitespace
    'url(\u00a0";) } } .victim { color: red; } /*")',
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

describe("onSubject", () => {
  const f = ":where(.f)";
  test.each([
    [".a", ".a:where(.f)"],
    [".a .b", ".a .b:where(.f)"],
    [".a > .b:hover", ".a > .b:hover:where(.f)"],
    [".a::before", ".a:where(.f)::before"],
    [".a:after", ".a:where(.f):after"],
    [".a .b::after:hover", ".a .b:where(.f)::after:hover"],
    // combinators and colons inside brackets and strings aren't the subject's
    [".a:not(.b .c)", ".a:not(.b .c):where(.f)"],
    ['.a [title="x ::y"]', '.a [title="x ::y"]:where(.f)'],
    [".a :is(.b, .c::before)", ".a :is(.b, .c::before):where(.f)"],
    [".a:before-ish", ".a:before-ish:where(.f)"],
    [".a ", ".a:where(.f)"],
  ])("%s", (selector, expected) => {
    expect(onSubject(selector, f)).toBe(expected);
  });

  test("nothing to add, nothing added", () => {
    expect(onSubject(".a .b", "")).toBe(".a .b");
  });
});

test("every rule's subject stops at another theme's root: the class, a nested rule's, a state's", () => {
  const own = notInOtherTheme(root);
  const css = renderOverrides("teal", {
    badge: { color: "red", "& .x::before": { color: "blue" } },
    ":hoverFeedback": { boxShadow: "none", "& .y": { color: "green" } },
  });
  expect(css).toContain(`.inv-badge:where(${root}, ${root} *)${own} {`);
  expect(css).toContain(
    `.inv-badge:where(${root}, ${root} *)${own} .x${own}::before {`,
  );
  expect(css).toContain(`${root} ${own}[data-interactive]`);
  expect(css).toContain(`:hover .y${own} {`);
  // but not a window's frame, which no theme is inside
  expect(
    renderOverrides("teal", {
      "app-frame__root": { "& .z": { color: "red" } },
    }),
  ).not.toContain(":not(");
});
