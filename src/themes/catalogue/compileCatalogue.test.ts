import type { ThemeCatalogue } from "@lumphammer/investigator-fvtt-types";
import { describe, expect, test, vi } from "vitest";

import { compileCatalogue } from "./compileCatalogue";
import {
  type CatalogueOverrides,
  catalogueOverridesCss as renderOverrides,
  notInOtherTheme,
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
      'badge: "extends" isn\'t base, variants, compoundVariants or states',
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
      expect(warnings.length).toBeGreaterThan(0);
    }
  });

  test("a style with nothing left in it replaces nothing; an empty one does", () => {
    const { overrides, warnings } = compile({
      badge: { base: { ":hover": { color: "danger" } } },
      callout: { base: {} },
    });
    expect(overrides).toEqual({ callout: {} });
    expect(warnings).toEqual([
      'badge.base: ":hover" is neither a selector with & nor an at-rule',
      "badge.base: nothing in it is a style, so it's left out",
    ]);
  });

  test("the logo's layout stays, whatever an override says", () => {
    const { overrides, warnings } = compile({
      logo: {
        base: {
          root: { position: "static", perspective: "200px" },
          backdrop: { position: "fixed", inset: 0, width: "150%" },
          front_wrapper: {
            transform: "none",
            color: "accent",
            "@media (min-width: 1px)": { transform: "none", opacity: 0.5 },
          },
          rear_wrapper: { color: "red" },
          front: { fontSize: "2em" },
        },
      },
    });
    // the perspective is the theme's; the box's position isn't
    expect(overrides["logo__root"]).toEqual({ perspective: "200px" });
    expect(overrides["logo__backdrop"]).toEqual({ width: "150%" });
    // nested rules too
    expect(overrides["logo__front_wrapper"]).toEqual({
      color: "var(--inv-accent)",
      "@media (min-width: 1px)": { opacity: 0.5 },
    });
    expect(overrides["logo__rear_wrapper"]).toEqual({});
    // the name's size is the theme's (LogoEditable fits it)
    expect(overrides["logo__front"]).toEqual({ fontSize: "2em" });
    expect(warnings).toEqual([
      'logo.root: "position" is set by the logo itself, so it\'s left out',
      'logo.backdrop: "position" is set by the logo itself, so it\'s left out',
      'logo.backdrop: "inset" is set by the logo itself, so it\'s left out',
      'logo.front_wrapper: "transform" is set by the logo itself, so it\'s left out',
      'logo.front_wrapper: "transform" is set by the logo itself, so it\'s left out',
      'logo.rear_wrapper: "color" is set by the logo itself, so it\'s left out',
    ]);
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

describe("state layers", () => {
  test("the theme's, everywhere, and a recipe's, by slot or not", () => {
    const { overrides, warnings } = compile({
      states: { hoverFeedback: { boxShadow: "none" } },
      tabs: {
        states: { hoverFeedback: { tab: { color: "accent" } } },
      },
      button: { states: { focusRing: { outlineColor: "danger" } } },
    });
    expect(warnings).toEqual([]);
    expect(overrides).toEqual({
      ":hoverFeedback": { boxShadow: "none" },
      "tabs__tab:hoverFeedback": { color: "var(--inv-accent)" },
      "button:focusRing": { outlineColor: "var(--inv-danger)" },
    });
  });

  test("an unknown state, or states that aren't by state, are left out with a warning", () => {
    const { overrides, warnings } = compile({
      states: { pressed: { color: "red" } },
      badge: { states: { pressed: { color: "red" } } },
      callout: { states: "loud" },
      tabs: { states: { hoverFeedback: { tub: { color: "red" } } } },
    });
    expect(overrides).toEqual({});
    expect(warnings).toEqual([
      'states: no such state "pressed"',
      'badge.states: no such state "pressed"',
      "callout.states: not styles by state",
      'tabs.states.hoverFeedback: no such slot "tub"',
    ]);
  });
});

test("a state override goes in its state's sub-layer, as specific as the default, the theme's before a class's", () => {
  const css = catalogueOverridesCss(
    "t",
    compile({
      // the class's first, to show it's put after the theme's
      tabs: { states: { hoverFeedback: { tab: { boxShadow: "none" } } } },
      states: {
        hoverFeedback: { boxShadow: "0 0 1px red" },
        dropTarget: { '&[data-drop-state="over"]': { outlineColor: "blue" } },
      },
      badge: { base: { color: "red" } },
    }).overrides,
  );
  const root = '[data-inv-theme="t"]';
  const tab = `.inv-tabs__tab:where(${root}, ${root} *)`;
  const hover =
    ':not(:disabled, [aria-disabled="true"], [data-disabled]):hover';
  const theme = css.indexOf(
    `@layer system.states.hover {\n${root} [data-interactive]${hover} { box-shadow: 0 0 1px red; }`,
  );
  const onTabs = css.indexOf(
    `@layer system.states.hover {\n${tab}[data-interactive]${hover} { box-shadow: none; }`,
  );
  expect(theme).toBeGreaterThan(-1);
  expect(onTabs).toBeGreaterThan(theme);
  // after the recipes' overrides too
  expect(css.indexOf("@layer system.recipes.base")).toBeLessThan(theme);
  expect(css).toContain(
    `${root} :is([data-drop-state="ready"], [data-drop-state="over"])[data-drop-state="over"] { outline-color: blue; }`,
  );
  // patched, not replaced
  expect(css.slice(theme)).not.toContain("revert-layer");
});
