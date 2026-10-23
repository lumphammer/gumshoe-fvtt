import { existsSync } from "fs";
import { resolve } from "path";
import { describe, expect, test } from "vitest";

import {
  buildFonts,
  convertFontsourceCss,
  fontsourceFamilies,
} from "./vitePluginFontsource";

const rule = (name: string, unicodeRange = "") => `/* ${name} */
@font-face {
  font-family: 'Cormorant Variable';
  font-style: normal;
  font-display: swap;
  font-weight: 300 700;
  src: url(./files/${name}.woff2) format('woff2-variations');${unicodeRange}
}
`;

describe("convertFontsourceCss", () => {
  test("keeps Latin subsets, renames the family and drops woff", () => {
    const css = [
      rule(
        "cormorant-cyrillic-ext-wght-normal",
        "\n  unicode-range: U+0460-052F;",
      ),
      rule(
        "cormorant-vietnamese-wght-normal",
        "\n  unicode-range: U+0102-0103;",
      ),
      rule(
        "cormorant-latin-ext-wght-normal",
        "\n  unicode-range: U+0100-02BA;",
      ),
      rule("cormorant-latin-wght-normal", "\n  unicode-range: U+0000-00FF;"),
    ].join("\n");
    const { faces, files } = convertFontsourceCss(css, "Cormorant");
    expect(files).toEqual([
      "cormorant-latin-ext-wght-normal.woff2",
      "cormorant-latin-wght-normal.woff2",
    ]);
    expect(faces[1]).toBe(`/* cormorant-latin-wght-normal */
@font-face {
  font-family: 'Cormorant';
  font-style: normal;
  font-display: swap;
  font-weight: 300 700;
  src: url(./fontsource/cormorant-latin-wght-normal.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}
`);
  });

  test("keeps the woff2 from a woff2 + woff src", () => {
    const css = `/* federo-latin-400-normal */
@font-face {
  font-family: 'Federo';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url(./files/federo-latin-400-normal.woff2) format('woff2'), url(./files/federo-latin-400-normal.woff) format('woff');
}`;
    const { faces, files } = convertFontsourceCss(css, "Federo");
    expect(files).toEqual(["federo-latin-400-normal.woff2"]);
    expect(faces[0]).toContain(
      "src: url(./fontsource/federo-latin-400-normal.woff2) format('woff2');",
    );
    expect(faces[0]).not.toContain(".woff)");
  });
});

describe("buildFonts", () => {
  test("every family has Latin faces and files that exist", () => {
    const { css, files } = buildFonts(
      fontsourceFamilies,
      resolve(import.meta.dirname, ".."),
    );
    for (const { family } of fontsourceFamilies) {
      expect(css).toContain(`font-family: '${family}';`);
    }
    expect(css).not.toContain("Variable'");
    expect(css).not.toMatch(/cyrillic|greek|vietnamese/);
    for (const { sourcePath } of files) {
      expect(existsSync(sourcePath)).toBe(true);
    }
  });
});
