import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// JSON.parse keeps the last of two equal keys without complaint, but
// Transifex, which reads en.json from main, rejects the whole file.

const langDir = path.resolve(import.meta.dirname, "../public/lang");
const langFiles = fs
  .readdirSync(langDir)
  .filter((file) => file.endsWith(".json"));

/**
 * Keys which appear more than once in the same object, at any depth, however
 * the file is laid out. Scans JSON's tokens: strings, and the braces and
 * brackets outside them. (The file must parse, which is checked first.)
 */
const duplicateKeys = (text: string) => {
  JSON.parse(text);
  // the keys seen in each open object; null for an array
  const stack: Array<Set<string> | null> = [];
  const duplicates: string[] = [];
  const stringToken = /"(?:[^"\\]|\\.)*"/y;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "{") {
      stack.push(new Set());
    } else if (char === "[") {
      stack.push(null);
    } else if (char === "}" || char === "]") {
      stack.pop();
    } else if (char === '"') {
      stringToken.lastIndex = i;
      const token = stringToken.exec(text)![0];
      i += token.length - 1;
      const keys = stack.at(-1);
      // a string in an object, followed by a colon, is a key
      if (keys && /^\s*:/.test(text.slice(i + 1))) {
        const key = JSON.parse(token) as string;
        if (keys.has(key)) duplicates.push(key);
        keys.add(key);
      }
    }
  }
  return duplicates;
};

describe("lang files", () => {
  it.each([
    ["two spaces", '{\n  "a": "1",\n  "b": "2",\n  "a": "3"\n}', ["a"]],
    ["any layout", '{"a":"1",\n\t\t"b" : "2",    "a"\n:"3"}', ["a"]],
    ["escapes", '{"a\\"b": "1", "a\\u0022b": "2"}', ['a"b']],
    ["values aren't keys", '{"a": "b", "b": "a", "c": ["a", "a"]}', []],
    ["per object", '{"a": {"x": 1}, "b": {"x": 1, "y": {"x": 2}}}', []],
    ["nested", '{"a": {"x": 1, "x": 2}}', ["x"]],
  ])("finds duplicate keys: %s", (_name, text, expected) => {
    expect(duplicateKeys(text)).toEqual(expected);
  });

  it.each(langFiles)("%s has no duplicate keys", (file) => {
    const text = fs.readFileSync(path.join(langDir, file), "utf8");
    expect(duplicateKeys(text)).toEqual([]);
  });
});
