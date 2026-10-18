import { describe, expect, it } from "vitest";

import {
  getStabilityState,
  getStabilityStatusTransition,
  isWorseState,
} from "./states";

describe("getStabilityState", () => {
  it.each([
    [5, "steady"],
    [1, "steady"],
    [0, "shaken"],
    [-5, "shaken"],
    [-6, "shattered"],
    [-11, "shattered"],
    [-12, "gone"],
    [-20, "gone"],
  ] as const)("%i: %s", (pool, expected) => {
    expect(getStabilityState(pool)).toBe(expected);
  });
});

describe("isWorseState", () => {
  it("orders the states", () => {
    expect(isWorseState("shaken", "steady")).toBe(true);
    expect(isWorseState("gone", "shattered")).toBe(true);
    expect(isWorseState("shaken", "shaken")).toBe(false);
    expect(isWorseState("steady", "shattered")).toBe(false);
  });
});

describe("getStabilityStatusTransition", () => {
  it("does nothing within a state", () => {
    expect(getStabilityStatusTransition("shaken", "shaken")).toBeNull();
  });

  it("swaps one status for another", () => {
    expect(getStabilityStatusTransition("shaken", "shattered")).toEqual({
      remove: ["shaken", "gone"],
      add: "shattered",
    });
  });

  it("clears them all on recovering", () => {
    expect(getStabilityStatusTransition("shattered", "steady")).toEqual({
      remove: ["shaken", "shattered", "gone"],
      add: null,
    });
  });
});
