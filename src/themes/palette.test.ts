import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

import {
  optionalPaletteKeys,
  paletteStyle,
  paletteVar,
  themeSlug,
} from "./palette";
import { tealTheme } from "./tealTheme";

test("paletteStyle sets only the entries the theme sets, and polarity as color-scheme", () => {
  const style = paletteStyle({ ...tealTheme.palette, link: "blue" });
  expect(style["colorScheme"]).toBe(tealTheme.palette.polarity);
  expect(style["--inv-surface-nested"]).toBe(tealTheme.palette.surfaceNested);
  expect(style["--inv-link"]).toBe("blue");
  expect(style).not.toHaveProperty("--inv-polarity");
  expect(style).not.toHaveProperty("--inv-on-danger");
});

test("the card gap's two axes are custom properties too", () => {
  const style = (cardGap: string) =>
    paletteStyle({ ...tealTheme.palette, cardGap });
  expect(style("1em 0.5em")).toMatchObject({
    "--inv-card-gap": "1em 0.5em",
    "--inv-card-gap-row": "1em",
    "--inv-card-gap-column": "0.5em",
  });
  expect(style("calc(1em + 2px)")).toMatchObject({
    "--inv-card-gap-row": "calc(1em + 2px)",
    "--inv-card-gap-column": "calc(1em + 2px)",
  });
  expect(
    paletteStyle({ ...tealTheme.palette, cardGap: undefined }),
  ).not.toHaveProperty("--inv-card-gap-row");
});

test("paletteVar", () => {
  expect(paletteVar("onAccent")).toBe("--inv-on-accent");
  expect(paletteVar("surfaceNested")).toBe("--inv-surface-nested");
});

test("themeSlug", () => {
  // readable, stable for a theme, and unique to it
  const theme = { displayName: "Teal of Cthulhu" };
  expect(themeSlug(theme)).toMatch(/^teal-of-cthulhu-\d+$/);
  expect(themeSlug(theme)).toBe(themeSlug(theme));
  expect(themeSlug({ displayName: "My Theme" })).not.toBe(
    themeSlug({ displayName: "My-Theme" }),
  );
  expect(themeSlug({ displayName: "テーマ" })).toMatch(/^theme-\d+$/);
});

test("palette.css has a default for every entry a theme can leave out", () => {
  const css = readFileSync(
    join(import.meta.dirname, "catalogue/palette.css"),
    "utf8",
  );
  for (const property of [
    ...optionalPaletteKeys.map(paletteVar),
    "--inv-card-gap-row",
    "--inv-card-gap-column",
  ]) {
    expect(css, property).toContain(`${property}:`);
  }
});
