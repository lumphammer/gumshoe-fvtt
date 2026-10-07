import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Foundry uses a plain `initial` as the new document's source value, uncloned,
// and `updateSource` merges into it in place, so an object or array literal
// is shared by every document created without that field: one document's
// changes leak into the next (e.g. ghost orphaned equipment fields). Use a
// function instead, e.g. `initial: () => ({})`.
//
// Foundry isn't available to tests, so this is a source scan rather than a
// test of the models themselves.

const srcDir = join(import.meta.dirname, "..");

const findSharedInitials = () =>
  readdirSync(srcDir, { recursive: true, encoding: "utf8" })
    .filter((path) => /\.tsx?$/.test(path) && !/\.test(-d)?\.tsx?$/.test(path))
    .flatMap((path) =>
      readFileSync(join(srcDir, path), "utf8")
        .split("\n")
        .flatMap((line, index) =>
          !/^\s*(\/\/|\*)/.test(line) && /\binitial:\s*[[{]/.test(line)
            ? [`${path}:${index + 1}: ${line.trim()}`]
            : [],
        ),
    );

describe("schema field initial values", () => {
  it("uses functions for object and array initial values", () => {
    expect(findSharedInitials()).toEqual([]);
  });
});
