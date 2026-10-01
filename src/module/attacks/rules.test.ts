import { describe, expect, it } from "vitest";

import {
  getDamageInstances,
  getEffectiveHitThreshold,
  getRequiredDamageRollCount,
  getWoundState,
  isCriticalHit,
  resolveDamage,
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

describe("getDamageInstances", () => {
  it("uses the first roll for a normal hit", () => {
    expect(getDamageInstances({ rolls: [4, 6], isCritical: false })).toEqual([
      4,
    ]);
  });

  it("adds two rolls together for a crit (p. 104 example)", () => {
    // two punches at d-2: 5 -> 3 and 6 -> 4
    expect(getDamageInstances({ rolls: [3, 4], isCritical: true })).toEqual([
      7,
    ]);
  });

  it("has nothing to give for a crit with only one roll yet", () => {
    expect(getDamageInstances({ rolls: [3], isCritical: true })).toEqual([]);
  });
});

describe("resolveDamage", () => {
  it("subtracts damage from Health (p. 103 example)", () => {
    const result = resolveDamage({
      startingHealth: 7,
      instances: [3],
      armor: 0,
      applyGunfireOnHumans: false,
    });
    expect(result.finalHealth).toBe(4);
    expect(result.woundState).toBe("ok");
  });

  it("applies the critical hit example (p. 104)", () => {
    const result = resolveDamage({
      startingHealth: 6,
      instances: [7],
      armor: 0,
      applyGunfireOnHumans: false,
    });
    expect(result.finalHealth).toBe(-1);
    expect(result.woundState).toBe("hurt");
  });

  it("subtracts armor from each instance, never below zero", () => {
    const result = resolveDamage({
      startingHealth: 6,
      instances: [4, 1],
      armor: 2,
      applyGunfireOnHumans: false,
    });
    expect(result.steps.map((s) => s.armorReduction)).toEqual([2, 1]);
    expect(result.finalHealth).toBe(4);
  });

  it("treats negative armor (statblock style) as its magnitude", () => {
    const result = resolveDamage({
      startingHealth: 6,
      instances: [4],
      armor: -1,
      applyGunfireOnHumans: false,
    });
    expect(result.finalHealth).toBe(3);
  });

  it("applies gunfire on humans to the burst example (p. 100)", () => {
    // M16 d+0, rolls 5 and 3, guard has Health 6
    const result = resolveDamage({
      startingHealth: 6,
      instances: [5, 3],
      armor: 0,
      applyGunfireOnHumans: true,
    });
    expect(result.steps.map((s) => s.healthAfter)).toEqual([1, -8]);
    expect(result.steps.map((s) => s.gunfireExtra)).toEqual([0, 6]);
    expect(result.woundState).toBe("seriouslyWounded");
  });

  it("applies gunfire on humans when landing exactly on 0", () => {
    const result = resolveDamage({
      startingHealth: 7,
      instances: [7],
      armor: 0,
      applyGunfireOnHumans: true,
    });
    expect(result.finalHealth).toBe(-6);
  });

  it("applies gunfire on humans to a target who was already Hurt", () => {
    const result = resolveDamage({
      startingHealth: -2,
      instances: [1],
      armor: 0,
      applyGunfireOnHumans: true,
    });
    expect(result.finalHealth).toBe(-9);
  });

  it("does not add gunfire damage past the Hurt band", () => {
    const result = resolveDamage({
      startingHealth: 3,
      instances: [10],
      armor: 0,
      applyGunfireOnHumans: true,
    });
    expect(result.finalHealth).toBe(-7);
    expect(result.steps[0].gunfireExtra).toBe(0);
  });

  it("does not add gunfire damage when armor stops the shot", () => {
    const result = resolveDamage({
      startingHealth: -1,
      instances: [2],
      armor: 3,
      applyGunfireOnHumans: true,
    });
    expect(result.finalHealth).toBe(-1);
    expect(result.steps[0].gunfireExtra).toBe(0);
  });

  it("does nothing with no instances", () => {
    const result = resolveDamage({
      startingHealth: 5,
      instances: [],
      armor: 0,
      applyGunfireOnHumans: true,
    });
    expect(result.finalHealth).toBe(5);
    expect(result.steps).toEqual([]);
  });
});
