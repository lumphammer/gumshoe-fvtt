import { describe, expect, it } from "vitest";

import { clampBondPoints, compareBonds, isBondBroken } from "./rules";

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
