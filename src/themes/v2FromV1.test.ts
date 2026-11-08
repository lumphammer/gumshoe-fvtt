import { describe, expect, test } from "vitest";

import { baseThemes } from "./baseThemes";
import { v1BaseThemes } from "./v1";
import { themeFromV1, themeFromV2, validateThemeV2 } from "./theme";
import { themeV2Source, v2FromV1 } from "./v2FromV1";

describe("v2FromV1", () => {
  test.each(Object.entries(v1BaseThemes))(
    "%s as V2 is the same theme",
    (_, theme) => {
      const v2 = v2FromV1(theme);
      // a V2 theme, with nothing to warn about
      const warnings: string[] = [];
      validateThemeV2(v2, (message) => warnings.push(message));
      expect(warnings).toEqual([]);
      // that resolves to what the V1 theme does
      const { displayName, palette, catalogue, globalCss } = themeFromV1(theme);
      expect(themeFromV2(v2)).toEqual({
        displayName,
        description: undefined,
        palette,
        catalogue,
        globalCss,
      });
    },
  );

  test("refuses a V1 value that would become a palette colour in V2", () => {
    const teal = v1BaseThemes["tealTheme"];
    expect(() =>
      v2FromV1({ ...teal, tabStyle: { ...teal.tabStyle, color: "text" } }),
    ).toThrow(
      "Teal of Cthulhu: a value that's a palette colour's name would become that colour in V2, in tabs__tab",
    );
  });

  test("leaves out what V2 works out the same", () => {
    const { palette } = v2FromV1(v1BaseThemes["tealTheme"]);
    // derived from accent either way
    expect(palette).not.toHaveProperty("link");
    expect(palette).not.toHaveProperty("radius");
  });
});

test("themeV2Source writes the system's asset paths with systemId", () => {
  const source = themeV2Source("myTheme", {
    ...v2FromV1(v1BaseThemes["tealTheme"]),
    globalCss: "a { background: url(systems/investigator/x.webp); }",
    catalogue: {
      // in a key, it stays a string
      card: {
        base: { root: { '&[data-src="systems/investigator/x.webp"]': {} } },
      },
    },
  });
  expect(source).toContain(
    '"&[data-src=\\"systems/investigator/x.webp\\"]": {}',
  );
  expect(source).toMatch(/^import \{ systemId \} from "\.\.\/constants";\n/);
  expect(source).toContain('import { defineThemeV2 } from "./theme";');
  expect(source).toContain("export const myTheme = defineThemeV2({");
  expect(source).toContain(
    "`a { background: url(systems/${systemId}/x.webp); }`",
  );
});

/*
 * The built-in themes were printed from their V1 originals, so they look the
 * same. A theme that's restyled on purpose drops out of this.
 */
const unchanged = Object.keys(baseThemes);
test.each(unchanged)("built-in %s still looks as it did in V1", (id) => {
  const { displayName, palette, catalogue, globalCss } = themeFromV1(
    v1BaseThemes[id],
  );
  const { description: _, ...resolved } = themeFromV2(baseThemes[id]);
  expect(resolved).toEqual({ displayName, palette, catalogue, globalCss });
});
