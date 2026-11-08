import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The native world: our parts of Foundry's own UI, which look like Foundry
// and never read the theme at all, not even its fonts (docs/theming.md).
// A source scan, like schemaInitialValues.test.ts.
const nativeWorld = [
  /^components\/messageCards\//,
  /^components\/combat\//,
  /^components\/native\//,
  /^components\/inputs\/NativeMenu\//,
  /^components\/GamePauseBanner\.tsx$/,
];

const srcDir = join(import.meta.dirname, "../..");

const nativeFilesMatching = (pattern: RegExp) =>
  readdirSync(srcDir, { recursive: true, encoding: "utf8" })
    .map((path) => path.replaceAll("\\", "/"))
    .filter(
      (path) =>
        /\.tsx?$/.test(path) &&
        !/\.test(-d)?\.tsx?$/.test(path) &&
        nativeWorld.some((area) => area.test(path)) &&
        pattern.test(readFileSync(join(srcDir, path), "utf8")),
    );

describe("the native world", () => {
  it("never uses the catalogue", () => {
    expect(
      nativeFilesMatching(/styled-system\/recipes|inputs\/Button"/),
    ).toEqual([]);
  });

  it("never reads the theme", () => {
    expect(
      // the theme's hooks, a V1 theme's colours, or the palette's properties
      nativeFilesMatching(/\b(ThemeContext|useTheme)\b|\.colors\b|--inv-/),
    ).toEqual([]);
  });
});
