import { describe, expect, it } from "vitest";

import { getSanityCap } from "./rules";

describe("getSanityCap", () => {
  it.each([
    [10, 0, 10],
    [10, 4, 6],
    [10, 10, 0],
    [10, 12, 0],
    [8, 3, 5],
  ])("base %i, cap ability %i: %i", (base, capAbilityRating, expected) => {
    expect(getSanityCap({ base, capAbilityRating })).toBe(expected);
  });
});
