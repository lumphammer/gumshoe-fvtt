import type { ThemeCatalogue } from "@lumphammer/investigator-fvtt-types";
import { describe, expect, test } from "vitest";

import { baseThemes } from "../baseThemes";
import { tealTheme } from "../tealTheme";
import { catalogueRules, rulesCss, styleCss, themeCss } from "./themeCss";

/** Each rule's layer and selectors, failing on any warning. */
const rules = (catalogue: ThemeCatalogue) =>
  catalogueRules(catalogue, (message) => {
    throw new Error(message);
  }).map(({ layer, frame, selectors }) => ({ layer, frame, selectors }));

const style = { color: "red" };

describe("catalogueRules", () => {
  test("each part goes in its default's layer, on its class", () => {
    expect(
      rules({
        badge: {
          base: style,
          variants: { tone: { danger: style } },
          compoundVariants: [{ tone: "danger", weight: "strong", css: style }],
        },
        tabs: { base: { tab: style } },
      }).map(({ layer, selectors }) => [layer, selectors.join()]),
    ).toEqual([
      ["system.recipes.base", ".inv-badge"],
      ["system.recipes.variants", ".inv-badge--tone_danger"],
      [
        "system.recipes.compound_variants",
        ".inv-badge--tone_danger:where(.inv-badge--weight_strong)",
      ],
      ["system.recipes.slots.base", ".inv-tabs__tab"],
    ]);
  });

  test("states go in the state layer's theme sub-layer, everywhere or on a recipe's element", () => {
    const [everywhere, onRecipe] = rules({
      states: { focusRing: style },
      card: { states: { hoverFeedback: { root: style } } },
    });
    expect(everywhere.layer).toBe("system.states.focus.theme");
    expect(everywhere.selectors[0]).toBe(":focus-visible");
    expect(onRecipe.layer).toBe("system.states.hover.theme");
    expect(onRecipe.selectors[0]).toMatch(
      /^\.inv-card__root\[data-interactive]/,
    );
  });

  test("a recipe's element states go in the state's layer, with its defaults, on its element", () => {
    expect(
      rules({
        button: { states: { pressed: style, disabled: style } },
        toggle: { states: { checked: { thumb: style } } },
      }).map(({ layer, selectors }) => [layer, selectors]),
    ).toEqual([
      [
        "system.states.pressed",
        ['.inv-button:is([aria-pressed="true"], [data-pressed])'],
      ],
      [
        "system.states.disabled",
        [
          '.inv-button:is(:disabled, [disabled], [aria-disabled="true"], [data-disabled])',
          "input:disabled + .inv-button:is(label, span)",
          "input:disabled + :is(label, span) > .inv-button",
        ],
      ],
      [
        "system.states.checked",
        [
          '.inv-toggle__thumb:is(:checked, [data-state="checked"])',
          "input:checked + .inv-toggle__thumb:is(label, span)",
          "input:checked + :is(label, span) > .inv-toggle__thumb",
        ],
      ],
    ]);
  });

  test("a variant's states sit beside its style, and aren't part of it", () => {
    const [look, pressed] = catalogueRules(
      {
        button: {
          variants: { kind: { pip: { ...style, states: { pressed: style } } } },
        },
      },
      (message) => {
        throw new Error(message);
      },
    );
    expect(look).toMatchObject({
      layer: "system.recipes.variants",
      selectors: [".inv-button--kind_pip"],
      style,
    });
    expect(pressed).toMatchObject({
      layer: "system.states.pressed",
      selectors: [
        '.inv-button.inv-button--kind_pip:is([aria-pressed="true"], [data-pressed])',
      ],
    });
  });

  test("states go over each other from the recipe's to a variant's to a compound variant's: more specific, or as specific and after", () => {
    expect(
      rules({
        button: {
          compoundVariants: [
            { kind: "pip", states: { hoverFeedback: style } },
            { kind: "pip", css: style, states: { focusRing: style } },
          ],
          variants: {
            kind: { pip: { states: { hoverFeedback: style } } },
          },
          states: { hoverFeedback: style },
        },
        fieldGrid: {
          variants: {
            stacked: { true: { states: { focusRing: { label: style } } } },
          },
          compoundVariants: [
            { stacked: true, states: { focusRing: { label: style } } },
          ],
        },
      }).map(({ layer, selectors }) => [layer, selectors[0]]),
    ).toEqual([
      ["system.recipes.compound_variants", ".inv-button--kind_pip"],
      [
        "system.states.hover.theme",
        expect.stringMatching(/^\.inv-button\[data-interactive].*:hover$/),
      ],
      [
        "system.states.hover.theme",
        expect.stringMatching(
          /^\.inv-button\.inv-button--kind_pip\[data-interactive].*:hover$/,
        ),
      ],
      [
        "system.states.hover.theme",
        expect.stringMatching(
          /^\.inv-button\.inv-button--kind_pip\[data-interactive].*:hover$/,
        ),
      ],
      [
        "system.states.focus.theme",
        ".inv-button.inv-button--kind_pip:focus-visible",
      ],
      [
        "system.states.focus.theme",
        ".inv-field-grid__label.inv-field-grid__label--stacked_true:focus-visible",
      ],
      [
        "system.states.focus.theme",
        ".inv-field-grid__label.inv-field-grid__label--stacked_true:focus-visible",
      ],
    ]);
  });

  test("a nested selector for one of the recipe's element states is kept, with a warning that says where it belongs", () => {
    const warnings: string[] = [];
    const out = catalogueRules(
      {
        button: {
          base: { "&[data-pressed]": style, "&:hover": style },
          variants: { kind: { pip: { "&:disabled": style } } },
        },
        // not states: a layout attribute, and a state the recipe doesn't have
        tabs: { base: { tab: { "&[data-wrapped]": style } } },
        callout: { base: { "&[aria-pressed=true]": style } },
      },
      (message) => warnings.push(message),
    );
    expect(out).toHaveLength(4);
    expect(warnings).toEqual([
      "button.base: \"&[data-pressed]\" is the pressed state, whose default goes over it: style it in `states.pressed`, the recipe's or beside a variant's style",
      "button.variants.kind.pip: \"&:disabled\" is the disabled state, whose default goes over it: style it in `states.disabled`, the recipe's or beside a variant's style",
    ]);
  });

  test("the app frame's rules are the frame's", () => {
    expect(rules({ appFrame: { base: { root: style } } })[0].frame).toBe(true);
    expect(rules({ badge: { base: style } })[0].frame).toBe(false);
  });

  test("names the catalogue doesn't have are left out, with a warning", () => {
    const warnings: string[] = [];
    const out = catalogueRules(
      {
        badger: { base: style },
        badge: {
          variants: { tone: { scary: style } },
          compoundVariants: [
            { tone: "danger", states: { checked: style } },
            { tone: "scary", states: { hoverFeedback: style } },
          ],
        },
        button: { states: { hovered: style } },
        tabs: { base: { tub: style } },
        states: { pressed: style },
      } as unknown as ThemeCatalogue,
      (message) => warnings.push(message),
    );
    expect(out).toEqual([]);
    expect(warnings).toEqual([
      'states: a theme\'s own states have no "pressed" state',
      'no such recipe "badger"',
      "badge.variants.tone.scary: no such variant value",
      'badge.compoundVariants[1]: no such variant value for "tone"',
      'badge.compoundVariants[0].states: badge has no "checked" state',
      'button.states: no such state "hovered"',
      'tabs.base: no such slot "tub"',
    ]);
  });
});

test("what isn't a style is left out: silently if it's undefined, else with a warning", () => {
  const warnings: string[] = [];
  const out = catalogueRules(
    {
      badge: undefined,
      callout: { base: undefined, variants: { tone: { danger: undefined } } },
      tabs: {
        base: { tab: undefined, content: "red" },
        states: { hoverFeedback: { tab: undefined } },
      },
      states: { focusRing: undefined },
    } as unknown as ThemeCatalogue,
    (message) => warnings.push(message),
  );
  expect(out).toEqual([]);
  expect(warnings).toEqual(["tabs.base.content: not a style"]);
});

test("the theme's own states come before any recipe's, however they're written", () => {
  expect(
    rules({
      row: { states: { dropTarget: style } },
      states: { dropTarget: style },
    }).map(({ selectors }) => selectors[0].startsWith(".inv-row")),
  ).toEqual([false, true]);
});

test("styleCss: pixels where React would, custom properties, fallbacks, nesting", () => {
  expect(
    styleCss({
      padding: 4,
      lineHeight: 1.5,
      margin: 0,
      "--x": 2,
      width: ["1em", "1lh"],
      "&:hover": { backgroundColor: "var(--inv-accent)" },
    }),
  ).toBe(
    "padding: 4px; line-height: 1.5; margin: 0; --x: 2; width: 1em; width: 1lh; &:hover { background-color: var(--inv-accent); }",
  );
});

describe("rulesCss", () => {
  const [rule] = catalogueRules({ badge: { base: style } });

  test("a rule is in its layer, scoped to the themed root, and stops at another theme's", () => {
    const css = rulesCss([rule], "t");
    expect(css).toMatch(
      /^@layer system\.recipes\.base \{ @scope to \(:scope \[data-inv-theme]\)/,
    );
    // a class is on the scope's root too
    expect(css).toContain(
      ":where(:scope).inv-badge, .inv-badge { color: red; }",
    );
  });

  test("the frame's rules are scoped to the frame", () => {
    expect(rulesCss([{ ...rule, frame: true }], "t")).toContain(
      '@scope ([data-inv-frame="t"]) to',
    );
  });

  test("an empty style is nothing", () => {
    expect(rulesCss([{ ...rule, style: {} }], "t")).toBe("");
  });
});

test("every built-in theme's catalogue fits the catalogue, with no warnings (V1 ones as converted)", () => {
  for (const [name, theme] of Object.entries(baseThemes)) {
    catalogueRules(theme.catalogue ?? {}, (message) => {
      throw new Error(`${name}: ${message}`);
    });
  }
});

test("themeCss is worked out once per theme", () => {
  expect(themeCss(tealTheme)).toContain(".inv-sheet-root--size_large");
  expect(themeCss(tealTheme)).toBe(themeCss(tealTheme));
});
