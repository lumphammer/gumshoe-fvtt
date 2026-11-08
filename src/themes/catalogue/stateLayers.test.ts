import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { expect, test } from "vitest";

import { stateLayers } from "./stateLayers";

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
  (_, { layer, selectors }) => {
    expect(blocks.get(`${layer}.default`)).toContain(
      `${selectors("")
        .map((selector) => `[data-inv-theme] ${selector}`)
        .join(", ")} {`,
    );
  },
);

test("each override comes after its default, and focus last, so it always shows", () => {
  expect(statesCss).toContain(
    "@layer system.states.hover.default, system.states.hover.theme, system.states.drop.default, system.states.drop.theme, system.states.focus.default, system.states.focus.theme;",
  );
});
