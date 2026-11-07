import { describe, expect, test } from "vitest";

import { baseThemes } from "./baseThemes";
import { niceThemeDark } from "./niceThemeDark";
import {
  luminanceOf,
  paletteFromV1,
  paletteStyle,
  paletteVar,
  themeSlug,
} from "./palette";
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

  test("picks the ink with the higher contrast ratio, not the brighter difference", () => {
    // on pure red, black is 5.25:1 and white 4.00:1
    const palette = paletteFromV1({
      ...tealTheme,
      colors: { ...tealTheme.colors, danger: "#f00" },
    });
    expect(palette.onDanger).toBe("#000000");
  });

  test.each([
    "rgb(255 255 255)",
    "rgb(100% 100% 100% / 0.9)",
    "oklch(0.95 0.02 90)",
    "lch(95% 10 90)",
  ])("reads light text in %s as a dark theme", (text) => {
    const palette = paletteFromV1({
      ...niceThemeDark,
      colors: { ...niceThemeDark.colors, text },
    });
    expect(palette.polarity).toBe("dark");
  });

  test("falls back to light for colours it can't read", () => {
    const palette = paletteFromV1({
      ...niceThemeDark,
      colors: { ...niceThemeDark.colors, text: "var(--some-text)" },
    });
    expect(palette.polarity).toBe("light");
  });
});

describe("luminanceOf", () => {
  test.each([
    ["#fff", 1],
    ["black", 0],
    ["rgb(255 255 255)", 1],
    ["oklch(1 0 0)", 1],
    ["oklch(0% 0 0)", 0],
    ["lab(100 0 0)", 1],
  ])("%s → %d", (color, expected) => {
    expect(luminanceOf(color)).toBeCloseTo(expected, 2);
  });

  test("is null for things that aren't colours it reads", () => {
    expect(luminanceOf("var(--x)")).toBeNull();
    expect(luminanceOf("color-mix(in srgb, red, blue)")).toBeNull();
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
  // readable, stable for a theme, and unique to it
  expect(themeSlug(tealTheme)).toMatch(/^teal-of-cthulhu-\d+$/);
  expect(themeSlug(tealTheme)).toBe(themeSlug(tealTheme));
  const a = { ...tealTheme, displayName: "My Theme" };
  const b = { ...tealTheme, displayName: "My-Theme" };
  expect(themeSlug(a)).not.toBe(themeSlug(b));
  expect(themeSlug({ ...tealTheme, displayName: "テーマ" })).toMatch(
    /^theme-\d+$/,
  );
});
