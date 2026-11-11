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
  "%s is written in states.css as a theme's override of it is",
  (_, { layer, selectors }) => {
    // so an override is exactly as specific as the default
    expect(blocks.get(layer)).toContain(
      `${selectors("[data-inv-theme] ", "").join(", ")} {`,
    );
  },
);

test("the sub-layers are in order: focus last, so it always shows", () => {
  expect(statesCss).toContain(
    "@layer system.states.hover, system.states.drop, system.states.focus;",
  );
});
