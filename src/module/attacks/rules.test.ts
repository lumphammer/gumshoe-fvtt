import { describe, expect, it } from "vitest";

import {
  getEffectiveHitThreshold,
  getRequiredDamageRollCount,
  getWoundState,
  isCriticalHit,
} from "./rules";

describe("getWoundState", () => {
  it.each([
    [1, "ok"],
    [0, "hurt"],
    [-5, "hurt"],
    [-6, "seriouslyWounded"],
    [-11, "seriouslyWounded"],
    [-12, "dead"],
    [-20, "dead"],
  ] as const)("Health %i is %s", (health, state) => {
    expect(getWoundState(health)).toBe(state);
  });
});

describe("getEffectiveHitThreshold", () => {
  it.each([
    ["exposed", false, 2],
    ["partial", false, 3],
    ["full", false, 4],
    ["full", true, 5],
    ["exposed", true, 3],
  ] as const)("cover %s, attacker hurt %s → %i", (cover, hurt, expected) => {
    expect(
      getEffectiveHitThreshold({
        baseHitThreshold: 3,
        cover,
        attackerIsHurt: hurt,
      }),
    ).toBe(expected);
  });
});

describe("isCriticalHit", () => {
  it("is a crit on a 6 with margin 5 (p. 104 example)", () => {
    // Seabring spends 3, rolls 6, result 9 vs HT 4
    expect(isCriticalHit({ hitDie: 6, hitTotal: 9, hitThreshold: 4 })).toBe(
      true,
    );
  });

  it("is not a crit with margin 4", () => {
    expect(isCriticalHit({ hitDie: 6, hitTotal: 8, hitThreshold: 4 })).toBe(
      false,
    );
  });

  it("is not a crit without an unmodified 6", () => {
    expect(isCriticalHit({ hitDie: 5, hitTotal: 12, hitThreshold: 3 })).toBe(
      false,
    );
  });
});

describe("getRequiredDamageRollCount", () => {
  it("needs nothing for a miss", () => {
    expect(getRequiredDamageRollCount({ isHit: false, isCritical: true })).toBe(
      0,
    );
  });

  it("needs one roll for a hit, two for a crit", () => {
    expect(getRequiredDamageRollCount({ isHit: true, isCritical: false })).toBe(
      1,
    );
    expect(getRequiredDamageRollCount({ isHit: true, isCritical: true })).toBe(
      2,
    );
  });
});
