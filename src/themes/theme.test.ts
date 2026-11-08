import type { ThemeV2 } from "@lumphammer/investigator-fvtt-types";
import { describe, expect, test } from "vitest";

import {
  optionalPaletteKeys,
  paletteStyle,
  requiredPaletteKeys,
  resolvePalette,
} from "./palette";
import { tealTheme } from "./v1/tealTheme";
import {
  defineThemeV2,
  themeFromV1,
  themeFromV2,
  validateThemeV2,
} from "./theme";

const theme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Test",
  palette: {
    polarity: "light",
    wallpaper: "#eee",
    surface: "#fff",
    surfaceNested: "#f4f4f4",
    control: "#ddd",
    text: "#222",
    accent: "#c00000",
    line: "#888",
    feedback: "#f80",
    danger: "#ff0000",
    warning: "#ffcc00",
    success: "#008000",
    info: "#2b6cb0",
  },
});

describe("resolvePalette", () => {
  test("works out what the theme leaves out", () => {
    const palette = resolvePalette(theme.palette);
    expect(palette).toMatchObject({
      textMuted: "color-mix(in srgb, #222 70%, #fff)",
      link: "#c00000",
      // ink by contrast: white on red, black on yellow
      onAccent: "#ffffff",
      onDanger: "#ffffff",
      onWarning: "#000000",
      radius: "0.25em",
      bodyFont: "inherit",
      displayCase: "none",
      cardGap: "0.5em",
    });
    // complete
    for (const key of [
      "polarity",
      ...requiredPaletteKeys,
      ...optionalPaletteKeys,
    ]) {
      expect(palette, key).toHaveProperty(key);
    }
  });

  test("keeps what the theme sets, and only palette entries", () => {
    const palette = resolvePalette({
      ...theme.palette,
      link: "blue",
      onAccent: "pink",
      cardGap: undefined,
      ...({ notAnEntry: "x" } as object),
    });
    expect(palette.link).toBe("blue");
    expect(palette.onAccent).toBe("pink");
    expect(palette.cardGap).toBe("0.5em");
    expect(palette).not.toHaveProperty("notAnEntry");
  });
});

test("the card gap's two axes are custom properties too", () => {
  const style = (cardGap: string) =>
    paletteStyle(resolvePalette({ ...theme.palette, cardGap }));
  expect(style("1em 0.5em")).toMatchObject({
    "--inv-card-gap": "1em 0.5em",
    "--inv-card-gap-row": "1em",
    "--inv-card-gap-column": "0.5em",
  });
  expect(style("calc(1em + 2px)")).toMatchObject({
    "--inv-card-gap-row": "calc(1em + 2px)",
    "--inv-card-gap-column": "calc(1em + 2px)",
  });
});

describe("validateThemeV2", () => {
  test("a theme is itself", () => {
    expect(validateThemeV2(theme)).toBe(theme);
  });

  test("a theme whose shape is wrong is refused, saying why", () => {
    const { info: _, ...noInfo } = theme.palette;
    expect(() =>
      validateThemeV2({
        ...theme,
        displayName: "",
        globalCss: 3,
        palette: { ...noInfo, polarity: "dim", cardGap: 1 },
      }),
    ).toThrow(
      'This isn\'t a V2 theme: displayName has to be a string, and not empty; globalCss has to be a string; palette.polarity has to be "light" or "dark"; palette.info has to be a string, and not empty; palette.cardGap has to be a string',
    );
    expect(() => validateThemeV2(null)).toThrow("A theme has to be an object");
    expect(() => validateThemeV2({ ...theme, palette: [] })).toThrow(
      "palette has to be an object",
    );
  });

  test("what isn't part of a theme is ignored, with a warning", () => {
    const warnings: string[] = [];
    validateThemeV2(
      { ...theme, colors: {}, palette: { ...theme.palette, glow: "red" } },
      (message) => warnings.push(message),
    );
    expect(warnings).toEqual([
      "palette.glow isn't a palette entry, so it's ignored",
      "colors isn't part of a theme, so it's ignored",
    ]);
  });
});

describe("themeFromV2", () => {
  test("a V2 theme, ready to style a sheet", () => {
    const resolved = themeFromV2({
      ...theme,
      description: "A test",
      catalogue: { badge: { base: { color: "accent" } } },
      globalCss: "@import url(x.css);",
    } satisfies ThemeV2);
    expect(resolved).toMatchObject({
      displayName: "Test",
      description: "A test",
      palette: { surface: "#fff", link: "#c00000" },
      catalogue: { badge: { color: "var(--inv-accent)" } },
      globalCss: "@import url(x.css);",
    });
  });
});

test("themeFromV1 is the same theme for the same V1 theme", () => {
  expect(themeFromV1(tealTheme)).toBe(themeFromV1(tealTheme));
  expect(themeFromV1(tealTheme).palette.cardGap).toBe("0.5em 0.5em");
});
