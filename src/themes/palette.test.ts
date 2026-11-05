import { describe, expect, test } from "vitest";

import { baseThemes } from "./baseThemes";
import { niceThemeDark } from "./niceThemeDark";
import { paletteFromV1, paletteStyle, paletteVar, themeSlug } from "./palette";
import { tealTheme } from "./tealTheme";

describe("paletteFromV1", () => {
  test.each(Object.entries(baseThemes))("%s has every entry", (_, theme) => {
    for (const [key, value] of Object.entries(paletteFromV1(theme))) {
      expect(value, key).toEqual(expect.any(String));
      expect(value, key).not.toBe("");
    }
  });

  test("maps V1 colours to their new names", () => {
    const palette = paletteFromV1(tealTheme);
    expect(palette.surface).toBe(tealTheme.colors.backgroundPrimary);
    expect(palette.surfaceNested).toBe(tealTheme.colors.backgroundSecondary);
    expect(palette.surfaceSolid).toBe(tealTheme.colors.bgOpaquePrimary);
    expect(palette.control).toBe(tealTheme.colors.backgroundButton);
    expect(palette.onAccent).toBe(tealTheme.colors.accentContrast);
    expect(palette.feedback).toBe(tealTheme.colors.glow);
    expect(palette.line).toBe(tealTheme.colors.controlBorder);
  });

  test("works out polarity from the text colour", () => {
    expect(paletteFromV1(tealTheme).polarity).toBe("light");
    expect(paletteFromV1(niceThemeDark).polarity).toBe("dark");
  });

  test("picks legible ink for status fills", () => {
    const palette = paletteFromV1({
      ...tealTheme,
      colors: { ...tealTheme.colors, danger: "#900", warning: "#fc0" },
    });
    expect(palette.onDanger).toBe("#ffffff");
    expect(palette.onWarning).toBe("#000000");
  });
});

describe("paletteStyle", () => {
  test("sets each entry as a custom property, and polarity as color-scheme", () => {
    const style = paletteStyle(paletteFromV1(niceThemeDark));
    expect(style["colorScheme"]).toBe("dark");
    expect(style["--inv-surface-nested"]).toBe(
      niceThemeDark.colors.backgroundSecondary,
    );
    expect(style).not.toHaveProperty("--inv-polarity");
  });
});

test("paletteVar", () => {
  expect(paletteVar("onAccent")).toBe("--inv-on-accent");
  expect(paletteVar("surfaceNestedSolid")).toBe("--inv-surface-nested-solid");
});

test("themeSlug", () => {
  expect(themeSlug(tealTheme)).toBe("teal-of-cthulhu");
});
