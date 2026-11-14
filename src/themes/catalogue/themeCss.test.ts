import type { ThemeCatalogue } from "@lumphammer/investigator-fvtt-types";
import { describe, expect, test } from "vitest";

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

  test("a compound variant's states are the state layer's, on an element with its variants", () => {
    expect(
      rules({
        button: {
          states: { hoverFeedback: style },
          compoundVariants: [
            { kind: "pip", states: { hoverFeedback: style } },
            { kind: "pip", css: style, states: { focusRing: style } },
          ],
        },
        fieldGrid: {
          compoundVariants: [
            { stacked: true, states: { focusRing: { label: style } } },
          ],
        },
      }).map(({ layer, selectors }) => [layer, selectors[0]]),
    ).toEqual([
      [
        "system.states.hover.theme",
        expect.stringMatching(
          /^\.inv-button\.inv-button--kind_pip\[data-interactive].*:hover$/,
        ),
      ],
      ["system.recipes.compound_variants", ".inv-button--kind_pip"],
      [
        "system.states.focus.theme",
        ".inv-button.inv-button--kind_pip:focus-visible",
      ],
      // the recipe's own, which the variant's go over: they're more specific
      [
        "system.states.hover.theme",
        expect.stringMatching(/^\.inv-button\[data-interactive].*:hover$/),
      ],
      [
        "system.states.focus.theme",
        ".inv-field-grid__label.inv-field-grid__label--stacked_true:focus-visible",
      ],
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
            { tone: "danger", states: { pressed: style } },
            { tone: "scary", states: { hoverFeedback: style } },
          ],
        },
        tabs: { base: { tub: style } },
        states: { pressed: style },
      } as unknown as ThemeCatalogue,
      (message) => warnings.push(message),
    );
    expect(out).toEqual([]);
    expect(warnings).toEqual([
      'states: no such state "pressed"',
      'no such recipe "badger"',
      "badge.variants.tone.scary: no such variant value",
      'badge.compoundVariants[0].states: no such state "pressed"',
      'badge.compoundVariants[1]: no such variant value for "tone"',
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

test("themeCss is worked out once per theme", () => {
  expect(themeCss(tealTheme)).toContain(".inv-sheet-root--size_large");
  expect(themeCss(tealTheme)).toBe(themeCss(tealTheme));
});
