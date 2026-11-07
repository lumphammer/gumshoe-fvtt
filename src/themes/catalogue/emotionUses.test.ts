import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Styles are Panda's (docs/theming.md): nothing uses Emotion any more (an
// `@emotion` import, or a `css` prop), since #1532. A style that varies at
// runtime goes in `style`, usually as a custom property a static class reads.
const notYetConverted: string[] = [];

const srcDir = join(import.meta.dirname, "../..");

const filesUsingEmotion = () =>
  readdirSync(srcDir, { recursive: true, encoding: "utf8" })
    .map((path) => path.replaceAll("\\", "/"))
    .filter(
      (path) =>
        /\.tsx?$/.test(path) &&
        !/\.test(-d)?\.tsx?$/.test(path) &&
        !path.startsWith("styled-system/"),
    )
    .filter((path) =>
      /from "@emotion\/|\bcss=\{/.test(
        readFileSync(join(srcDir, path), "utf8"),
      ),
    )
    .sort();

describe("using Emotion", () => {
  it("happens only in files that haven't been converted yet", () => {
    const using = filesUsingEmotion();
    // new ones: use Panda's css() instead
    expect(using.filter((path) => !notYetConverted.includes(path))).toEqual([]);
    // converted ones: take them off the list
    expect(notYetConverted.filter((path) => !using.includes(path))).toEqual([]);
  });
});
