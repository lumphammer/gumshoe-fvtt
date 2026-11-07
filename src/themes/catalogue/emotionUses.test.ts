import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Static styles are Panda's now; Emotion is on its way out (#1532). These
// files still use it: an `@emotion` import, or the `css` prop. The list
// only shrinks: when you convert one, take it off. A style that varies at
// runtime goes in `style`, usually as a custom property a static class
// reads (docs/theming.md).
const notYetConverted = ["components/EmotionPopoutCache.tsx"];

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
