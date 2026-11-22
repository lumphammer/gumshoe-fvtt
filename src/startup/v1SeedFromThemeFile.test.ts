import { describe, expect, test } from "vitest";

import { v1SeedFromThemeFile } from "./v1SeedFromThemeFile";

const blob = { schemaVersion: "v1", displayName: "Mine" };

describe("a theme file's layout", () => {
  test("is left out when the file has none", () => {
    expect(v1SeedFromThemeFile(blob).layout).toBeUndefined();
  });

  test.each(["standard", "full-frame"])("%s is kept", (layout) => {
    expect(v1SeedFromThemeFile({ ...blob, layout }).layout).toBe(layout);
  });

  test("anything else is refused", () => {
    expect(() => v1SeedFromThemeFile({ ...blob, layout: "wide" })).toThrow(
      'layout "wide" not recognised',
    );
  });
});
