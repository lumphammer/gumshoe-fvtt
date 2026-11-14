import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { expect, test } from "vitest";

import { elementStates, stateLayers } from "./stateLayers";

/** CSS without comments, its whitespace collapsed, and none inside brackets. */
const normalise = (css: string) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\( /g, "(")
    .replace(/ \)/g, ")");

const statesCss = normalise(
  readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), "states.css"),
    "utf8",
  ),
);

/** Each sub-layer's block in states.css, by the layer's name. */
const blocks = new Map(
  [...statesCss.matchAll(/@layer ([\w.]+) \{(.*?\}) \}/g)].map(
    ([, layer, body]) => [layer, body],
  ),
);

test.each(Object.entries(stateLayers))(
  "%s's default is for what a theme's override of it is for",
  (_, { defaultLayer, selectors }) => {
    expect(blocks.get(defaultLayer)).toContain(
      `${selectors("")
        .map((selector) => `[data-inv-theme] ${selector}`)
        .join(", ")} {`,
    );
  },
);

test("the element states come first, in their order, each a layer for its defaults and a theme's changes; then the state layers, each override after its default, and focus last, so it always shows", () => {
  const layers = [
    ...Object.values(elementStates).map(({ defaultLayer }) => defaultLayer),
    ...["hoverFeedback", "dropTarget", "focusRing"].flatMap((state) => {
      const { defaultLayer, themeLayer } =
        stateLayers[state as keyof typeof stateLayers];
      return [defaultLayer, themeLayer];
    }),
  ];
  expect(statesCss).toContain(`@layer ${layers.join(", ")};`);
  for (const { defaultLayer, themeLayer } of Object.values(elementStates)) {
    expect(themeLayer).toBe(defaultLayer);
  }
});
