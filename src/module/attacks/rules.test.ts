import { describe, expect, it } from "vitest";

import {
  getAvailableFireModes,
  getEffectiveHitThreshold,
  getMinimumSpend,
  getRequiredDamageRollCount,
  getWoundState,
  getBurstBulletCount,
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

describe("getBurstBulletCount", () => {
  it.each([
    [-1, 1],
    [0, 1],
    [2, 1],
    [3, 2],
    // p. 100: margin of 5 means one extra bullet...
    [5, 2],
    // ...and a margin of 6 would have meant two
    [6, 3],
    [20, 3],
  ])("a margin of %i gets %i bullets", (margin, bullets) => {
    expect(getBurstBulletCount(margin)).toBe(bullets);
  });

  it("needs an extra roll for a critical burst", () => {
    expect(
      getRequiredDamageRollCount({
        isHit: true,
        isCritical: true,
        bulletCount: 3,
      }),
    ).toBe(4);
  });

  it("needs a roll per bullet", () => {
    expect(
      getRequiredDamageRollCount({
        isHit: true,
        isCritical: false,
        bulletCount: 3,
      }),
    ).toBe(3);
  });
});

describe("getAvailableFireModes", () => {
  it.each([
    ["single", true, ["single"]],
    ["selective", true, ["single", "burst", "fullAuto"]],
    ["alwaysAuto", true, ["fullAuto"]],
    ["selective", false, ["single"]],
    ["alwaysAuto", false, ["single"]],
  ] as const)(
    "%s weapon, autofire %s: %j",
    (weaponFireModes, useAutofire, expected) => {
      expect(getAvailableFireModes({ weaponFireModes, useAutofire })).toEqual(
        expected,
      );
    },
  );
});

describe("getMinimumSpend", () => {
  it.each([
    ["single", "selective", 0],
    ["burst", "selective", 3],
    ["fullAuto", "selective", 5],
    // machine guns don't need to spend to fire full-auto (p. 100)
    ["fullAuto", "alwaysAuto", 0],
  ] as const)(
    "%s from a %s weapon: %i",
    (fireMode, weaponFireModes, expected) => {
      expect(getMinimumSpend({ fireMode, weaponFireModes })).toBe(expected);
    },
  );
});
