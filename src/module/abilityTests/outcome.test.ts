import { describe, expect, it } from "vitest";

import {
  difficultyChoices,
  getGeneralTestDifficultyModifiers,
  getTestDifficulty,
  getTestOutcome,
  isSuccessfulOutcome,
} from "./outcome";

describe("getTestOutcome", () => {
  it.each([
    // die, total, difficulty
    [6, 6, 4, "successful6"],
    // a 6 that only succeeds with points spent is still a successful 6
    [6, 9, 8, "successful6"],
    // a 6 that fails isn't
    [6, 7, 8, "failure"],
    [4, 4, 4, "success"],
    // a total of 6 or more without a 6 on the die is an ordinary success
    [5, 8, 4, "success"],
    [3, 3, 4, "failure"],
    [1, 1, 4, "failed1"],
    // a 1 that succeeds with points spent isn't a failed 1
    [1, 4, 4, "success"],
    [1, 1, 1, "success"],
  ] as const)(
    "die %i, total %i, Difficulty %i: %s",
    (die, total, difficulty, expected) => {
      expect(getTestOutcome({ die, total, difficulty })).toBe(expected);
    },
  );
});

describe("isSuccessfulOutcome", () => {
  it.each([
    ["successful6", true],
    ["success", true],
    ["failure", false],
    ["failed1", false],
  ] as const)("%s: %s", (outcome, expected) => {
    expect(isSuccessfulOutcome(outcome)).toBe(expected);
  });
});

describe("getTestDifficulty", () => {
  it("is the base with no modifiers", () => {
    expect(getTestDifficulty(4, [])).toBe(4);
  });
  it("adds the modifiers", () => {
    expect(getTestDifficulty(4, [{ amount: 1 }, { amount: -2 }])).toBe(3);
  });
});

describe("getGeneralTestDifficultyModifiers", () => {
  it.each([null, "steady"] as const)("none when %s", (state) => {
    expect(getGeneralTestDifficultyModifiers(state)).toEqual([]);
  });
  it.each(["shaken", "shattered", "gone"] as const)("+1 when %s", (state) => {
    expect(getGeneralTestDifficultyModifiers(state)).toEqual([
      { kind: "stabilityState", state, amount: 1 },
    ]);
  });
});

describe("difficultyChoices", () => {
  it("runs from 2 to 12", () => {
    expect(difficultyChoices()).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
  it("keeps a current value outside that", () => {
    expect(difficultyChoices(1)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(difficultyChoices(4)).toHaveLength(11);
  });
});
