import { describe, expect, it } from "vitest";

import {
  canBurnBond,
  clampBondPoints,
  compareBonds,
  doesSpendBreakBond,
  getMaxBondSpend,
  isBondBroken,
} from "./rules";

describe("clampBondPoints", () => {
  it.each([
    [-3, -1],
    [-1, -1],
    [0, 0],
    [4, 4],
    [7, 4],
  ])("%i becomes %i", (points, expected) => {
    expect(clampBondPoints(points)).toBe(expected);
  });
});

describe("isBondBroken", () => {
  it.each([
    [-2, true],
    [-1, true],
    [0, false],
    [3, false],
  ])("%i points: %s", (points, expected) => {
    expect(isBondBroken(points)).toBe(expected);
  });
});

describe("compareBonds", () => {
  it("puts ordinary Bonds before DELTA GREEN Bonds, each by name", () => {
    const bonds = [
      { name: "Carlos", isDeltaGreen: true },
      { name: "Zorah", isDeltaGreen: false },
      { name: "Bob", isDeltaGreen: true },
      { name: "Jerome", isDeltaGreen: false },
    ];
    expect(bonds.toSorted(compareBonds).map((b) => b.name)).toEqual([
      "Jerome",
      "Zorah",
      "Bob",
      "Carlos",
    ]);
  });
});

describe("getMaxBondSpend", () => {
  it.each([
    [4, 5],
    [1, 2],
    [0, 1],
    [-1, 0],
  ])("a Bond with %i points can spend %i", (points, expected) => {
    expect(getMaxBondSpend(points)).toBe(expected);
  });
});

describe("doesSpendBreakBond", () => {
  it.each([
    [2, 1, false],
    [2, 2, false],
    [2, 3, true],
    [0, 1, true],
    // nothing spent
    [0, 0, false],
    // already broken
    [-1, 0, false],
  ])("%i points, spending %i: %s", (points, spend, expected) => {
    expect(doesSpendBreakBond(points, spend)).toBe(expected);
  });
});

describe("canBurnBond", () => {
  it.each([
    // enough points, Stability below its rating
    [2, 3, 6, true],
    // 1 point can still go to -1
    [1, 3, 6, true],
    [0, 3, 6, false],
    // Stability already full
    [4, 6, 6, false],
    // Stability negative (Shaken): can burn back up
    [3, -2, 6, true],
  ])(
    "Bond %i, Stability %i/%i: %s",
    (bondPoints, stabilityPool, stabilityRating, expected) => {
      expect(canBurnBond({ bondPoints, stabilityPool, stabilityRating })).toBe(
        expected,
      );
    },
  );
});
