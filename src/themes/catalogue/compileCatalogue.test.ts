import type { ThemeCatalogue } from "@lumphammer/investigator-fvtt-types";
import { describe, expect, test, vi } from "vitest";

import { compileCatalogue } from "./compileCatalogue";
import { catalogueOverridesCss } from "./overrides";

/** Compiled, with the warnings it gave. */
const compile = (catalogue: unknown) => {
  const warnings: string[] = [];
  const overrides = compileCatalogue(catalogue as ThemeCatalogue, (message) =>
    warnings.push(message),
  );
  return { overrides, warnings };
};

describe("compileCatalogue", () => {
  test("a recipe's base, variants and compound variants, by class", () => {
    const { overrides, warnings } = compile({
      badge: {
        base: { borderRadius: 0 },
        variants: { tone: { danger: { fontWeight: "bold" } } },
        compoundVariants: [
          { tone: "danger", weight: "strong", css: { fontStyle: "italic" } },
        ],
      },
    });
    expect(warnings).toEqual([]);
    expect(overrides).toEqual({
      badge: { borderRadius: 0 },
      "badge--tone_danger": { fontWeight: "bold" },
      "badge--tone_danger.badge--weight_strong": { fontStyle: "italic" },
    });
  });

  test("a slot recipe's parts are by slot", () => {
    const { overrides, warnings } = compile({
      tabs: { base: { tab: { padding: 4 }, content: { margin: 0 } } },
    });
    expect(warnings).toEqual([]);
    expect(overrides).toEqual({
      tabs__tab: { padding: 4 },
      tabs__content: { margin: 0 },
    });
  });

  test("a boolean variant's value can be a boolean", () => {
    const { overrides } = compile({
      partyCell: {
        variants: { header: { true: { position: "sticky" } } },
        compoundVariants: [{ header: true, zero: false, css: { top: 0 } }],
      },
    });
    expect(overrides).toEqual({
      "party-cell--header_true": { position: "sticky" },
      "party-cell--header_true.party-cell--zero_false": { top: 0 },
    });
  });

  test("a palette colour's name is that colour, in a colour property only", () => {
    const { overrides } = compile({
      badge: {
        base: {
          color: "accent",
          borderTopColor: "line",
          background: "surfaceNested",
          // a CSS keyword that's also a palette name
          cursor: "text",
          // a palette entry inside an expression is its custom property
          boxShadow: "0 0 1em var(--inv-feedback)",
          "&:hover": { backgroundColor: "control" },
        },
      },
    });
    expect(overrides["badge"]).toEqual({
      color: "var(--inv-accent)",
      borderTopColor: "var(--inv-line)",
      background: "var(--inv-surface-nested)",
      cursor: "text",
      boxShadow: "0 0 1em var(--inv-feedback)",
      "&:hover": { backgroundColor: "var(--inv-control)" },
    });
  });

  test("nested rules need & or an at-rule; fallbacks and custom properties pass", () => {
    const { overrides, warnings } = compile({
      input: {
        base: {
          width: ["1em", "1lh"],
          "--gap": "1px",
          "input:checked + &": { color: "red" },
          "@media (min-width: 40em)": { padding: 4 },
          img: { width: 1 },
        },
      },
    });
    expect(overrides["input"]).toEqual({
      width: ["1em", "1lh"],
      "--gap": "1px",
      "input:checked + &": { color: "red" },
      "@media (min-width: 40em)": { padding: 4 },
    });
    expect(warnings).toEqual([
      'input.base: "img" is neither a selector with & nor an at-rule',
    ]);
  });

  test("what doesn't fit the catalogue is left out, with a warning", () => {
    const { overrides, warnings } = compile({
      badger: {},
      badge: {
        variants: { tone: { scary: {} }, size: {} },
        compoundVariants: [{ tone: "scary", css: {} }, { css: {} }, "nope"],
        extends: "x",
      },
      tabs: { base: { tub: {} } },
      card: { base: "red" },
    });
    expect(overrides).toEqual({});
    expect(warnings).toEqual([
      'no such recipe "badger"',
      'badge.tone: no such value "scary"',
      'badge: no such variant "size"',
      'badge.compoundVariants[0]: no such variant value for "tone"',
      "badge.compoundVariants[1]: names no variants",
      "badge.compoundVariants[2]: not a compound variant",
      'badge: "extends" isn\'t base, variants or compoundVariants',
      'tabs.base: no such slot "tub"',
      "card.base: not a style for each slot",
    ]);
  });

  test("a compound of one variant is in the compound variants' layer too", () => {
    const { overrides } = compile({
      badge: { compoundVariants: [{ tone: "danger", css: { color: "red" } }] },
    });
    expect(overrides).toEqual({
      "badge--tone_danger.badge--tone_danger": { color: "red" },
    });
    expect(catalogueOverridesCss("t", overrides)).toContain(
      "@layer system.recipes.compound_variants {\n.inv-badge--tone_danger:where(.inv-badge--tone_danger):where(",
    );
  });

  test("compounds for the same combination merge, nested rules too, whatever their order", () => {
    const { overrides } = compile({
      badge: {
        compoundVariants: [
          {
            tone: "danger",
            weight: "strong",
            css: { "&:hover": { color: "red" } },
          },
          {
            weight: "strong",
            tone: "danger",
            css: { "&:hover": { background: "blue" } },
          },
        ],
      },
    });
    expect(overrides).toEqual({
      "badge--tone_danger.badge--weight_strong": {
        "&:hover": { color: "red", background: "blue" },
      },
    });
  });

  test("a palette colour's name is that colour in fallbacks too", () => {
    const { overrides } = compile({
      badge: { base: { color: ["accent", "oklch(0.5 0.1 20)"] } },
    });
    expect(overrides["badge"]).toEqual({
      color: ["var(--inv-accent)", "oklch(0.5 0.1 20)"],
    });
  });

  test("a style that isn't one replaces nothing", () => {
    const { overrides, warnings } = compile({
      badge: { base: null },
      tabs: { base: { tab: "red" } },
    });
    expect(overrides).toEqual({});
    expect(warnings).toEqual([
      "badge.base: not a style object",
      "tabs.base.tab: not a style object",
    ]);
  });

  test("odd JSON gets warnings, not exceptions", () => {
    for (const catalogue of [
      null,
      [],
      "badge",
      JSON.parse('{"__proto__": {}}'),
      { badge: { variants: { toString: { x: {} } } } },
      { badge: { compoundVariants: [{ tone: { toString: null }, css: {} }] } },
      { badge: { base: JSON.parse('{"__proto__": {"color": "red"}}') } },
    ]) {
      const { overrides, warnings } = compile(catalogue);
      expect(Object.keys(overrides["badge"] ?? {})).toEqual([]);
      expect(warnings).toHaveLength(1);
    }
  });

  test("warns on the console by default", () => {
    const warn = vi.spyOn(console, "warn").mockReturnValue(undefined);
    compileCatalogue({ badger: {} } as ThemeCatalogue);
    expect(warn).toHaveBeenCalledWith(
      'Theme catalogue: no such recipe "badger"',
    );
    warn.mockRestore();
  });
});

test("a compound override is a rule for an element with all its variants, in the compound variants' layer", () => {
  const css = catalogueOverridesCss(
    "t",
    compile({
      badge: {
        compoundVariants: [
          { tone: "danger", weight: "strong", css: { color: "red" } },
        ],
      },
    }).overrides,
  );
  expect(css).toContain("@layer system.recipes.compound_variants {");
  expect(css).toContain(
    '.inv-badge--tone_danger:where(.inv-badge--weight_strong):where([data-inv-theme="t"], [data-inv-theme="t"] *) { color: red; }',
  );
  // a patch, not a replacement
  expect(css).not.toContain("revert-layer");
});
