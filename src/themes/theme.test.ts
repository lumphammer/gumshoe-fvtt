import { describe, expect, test } from "vitest";

import { tealTheme } from "./tealTheme";
import { validateThemeV2 } from "./theme";

describe("validateThemeV2", () => {
  test("a theme is itself", () => {
    expect(validateThemeV2(tealTheme)).toBe(tealTheme);
  });

  test("a style's value can be undefined, as a conditional one is", () => {
    const withUndefined = {
      ...tealTheme,
      catalogue: {
        badge: { base: { color: undefined, "&:hover": { color: undefined } } },
      },
    };
    expect(validateThemeV2(withUndefined)).toBe(withUndefined);
  });

  test("a theme whose shape is wrong is refused, saying why", () => {
    const { info: _, ...noInfo } = tealTheme.palette;
    const refused = (theme: unknown) => () => validateThemeV2(theme);
    expect(
      refused({ ...tealTheme, palette: { ...noInfo, polarity: "dim" } }),
    ).toThrow(
      /^This isn't a V2 theme: .*expected one of "light"\|"dark" at "palette.polarity".* at "palette.info"/,
    );
    expect(refused({ ...tealTheme, displayName: "" })).toThrow(
      /at "displayName"/,
    );
    expect(refused({ ...tealTheme, globalCss: 3 })).toThrow(/at "globalCss"/);
    expect(refused(null)).toThrow(/^This isn't a V2 theme/);
    expect(refused({ ...tealTheme, palette: [] })).toThrow(/at "palette"/);
  });

  test("what isn't part of a theme is ignored, with a warning", () => {
    const warnings: string[] = [];
    validateThemeV2(
      {
        ...tealTheme,
        colors: {},
        palette: { ...tealTheme.palette, glow: "red" },
      },
      (message) => warnings.push(message),
    );
    expect(warnings).toEqual([
      "colors isn't part of a theme, so it's ignored",
      "palette.glow isn't a palette entry, so it's ignored",
    ]);
  });
});
