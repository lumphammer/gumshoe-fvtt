import { describe, expect, it } from "vitest";

import {
  getBondCap,
  getCappedRating,
  getProgressAfterClick,
  getRefreshedPool,
  isAdapted,
} from "./adaptation";

describe("isAdapted", () => {
  it.each([
    [0, false],
    [2, false],
    [3, true],
  ])("%i boxes: %s", (progress, expected) => {
    expect(isAdapted(progress)).toBe(expected);
  });
});

describe("getProgressAfterClick", () => {
  it.each([
    // [progress, box clicked, after]
    [0, 1, 1],
    [0, 3, 3],
    [1, 2, 2],
    [2, 2, 1],
    [3, 1, 0],
    [3, 3, 2],
  ])("at %i, clicking box %i makes %i", (progress, box, expected) => {
    expect(getProgressAfterClick(progress, box)).toBe(expected);
  });
});

describe("getBondCap", () => {
  it("is 4 normally, and 2 when Adapted to Violence", () => {
    expect(getBondCap(false)).toBe(4);
    expect(getBondCap(true)).toBe(2);
  });
});

describe("getCappedRating", () => {
  it.each([
    [3, null, 3],
    [3, 1, 1],
    [0, 1, 0],
  ])("rating %i, cap %s: %i", (rating, cap, expected) => {
    expect(getCappedRating(rating, cap)).toBe(expected);
  });
});

describe("getRefreshedPool", () => {
  it.each([
    // [pool, rating, after]
    [0, 4, 4],
    [3, 4, 4],
    // pools above the rating come down to it
    [3, 1, 1],
    [-2, 8, 8],
  ])("normally, %i of %i refreshes to %i", (pool, rating, expected) => {
    expect(
      getRefreshedPool({ pool, rating, adaptedToHelplessness: false }),
    ).toBe(expected);
  });

  it.each([
    [0, 4, 3],
    [2, 4, 3],
    // within a point of the rating, there's nothing to gain
    [3, 4, 3],
    [4, 4, 4],
    [3, 1, 1],
    [-2, 8, 7],
    [0, 1, 0],
  ])(
    "Adapted to Helplessness, %i of %i refreshes to %i",
    (pool, rating, expected) => {
      expect(
        getRefreshedPool({ pool, rating, adaptedToHelplessness: true }),
      ).toBe(expected);
    },
  );
});
