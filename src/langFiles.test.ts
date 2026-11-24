import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// JSON.parse keeps the last of two equal keys without complaint, but
// Transifex, which reads en.json from main, rejects the whole file.

const langDir = path.resolve(import.meta.dirname, "../public/lang");
const langFiles = fs
  .readdirSync(langDir)
  .filter((file) => file.endsWith(".json"));

/** Keys which appear more than once on the top level of a flat lang file */
const duplicateKeys = (text: string) => {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const line of text.split("\n")) {
    const match = /^ {2}"((?:[^"\\]|\\.)*)"\s*:/.exec(line);
    if (match === null) continue;
    const key = JSON.parse(`"${match[1]}"`) as string;
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
  }
  return duplicates;
};

describe("lang files", () => {
  it("finds a duplicate key", () => {
    expect(duplicateKeys('{\n  "a": "1",\n  "b": "2",\n  "a": "3"\n}')).toEqual(
      ["a"],
    );
  });

  it.each(langFiles)("%s has no duplicate keys", (file) => {
    const text = fs.readFileSync(path.join(langDir, file), "utf8");
    expect(duplicateKeys(text)).toEqual([]);
  });
});
