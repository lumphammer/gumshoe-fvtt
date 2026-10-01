import { describe, expect, it } from "vitest";

import type { Lethality } from "./lethality";
import type { DamageInstance } from "./resolveDamage";
import { getDamageInstances, resolveDamage } from "./resolveDamage";

const damage = (amount: number): DamageInstance => ({
  kind: "damage",
  amount,
});

const L1: Lethality = { rating: 1, asterisks: 0, hs: 0 };
const L1H: Lethality = { rating: 1, asterisks: 0, hs: 1 };

const lethal = (
  die: number,
  lethality: Lethality = L1,
  immune = false,
): DamageInstance => ({ kind: "lethality", die, lethality, immune });

const roll = (die: number, total: number) => ({ die, total });

describe("getDamageInstances", () => {
  const plain = { lethality: null, immuneToLethality: false };

  it("uses the first roll for a normal hit", () => {
    expect(
      getDamageInstances({
        rolls: [roll(2, 4), roll(4, 6)],
        isCritical: false,
        ...plain,
      }),
    ).toEqual([damage(4)]);
  });

  it("adds two rolls together for a crit (p. 104 example)", () => {
    // two punches at d-2: 5 -> 3 and 6 -> 4
    expect(
      getDamageInstances({
        rolls: [roll(5, 3), roll(6, 4)],
        isCritical: true,
        ...plain,
      }),
    ).toEqual([damage(7)]);
  });

  it("has nothing to give for a crit with only one roll yet", () => {
    expect(
      getDamageInstances({ rolls: [roll(5, 3)], isCritical: true, ...plain }),
    ).toEqual([]);
  });

  it("makes each bullet of a burst its own instance", () => {
    expect(
      getDamageInstances({
        rolls: [roll(5, 5), roll(3, 3), roll(6, 6)],
        isCritical: false,
        bulletCount: 2,
        ...plain,
      }),
    ).toEqual([damage(5), damage(3)]);
  });

  it("waits until every bullet has a roll", () => {
    expect(
      getDamageInstances({
        rolls: [roll(5, 5)],
        isCritical: false,
        bulletCount: 2,
        ...plain,
      }),
    ).toEqual([]);
  });

  it("gives each bullet its own Lethality roll", () => {
    expect(
      getDamageInstances({
        rolls: [roll(1, 1), roll(4, 4)],
        isCritical: false,
        bulletCount: 2,
        lethality: L1,
        immuneToLethality: false,
      }),
    ).toEqual([lethal(1), lethal(4)]);
  });

  it("uses the raw die for Lethality", () => {
    expect(
      getDamageInstances({
        rolls: [roll(2, 4)],
        isCritical: false,
        lethality: L1,
        immuneToLethality: false,
      }),
    ).toEqual([lethal(2)]);
  });

  it("makes a Lethality crit two separate Lethality rolls", () => {
    expect(
      getDamageInstances({
        rolls: [roll(2, 4), roll(1, 3)],
        isCritical: true,
        lethality: L1,
        immuneToLethality: true,
      }),
    ).toEqual([lethal(2, L1, true), lethal(1, L1, true)]);
  });
});

describe("resolveDamage", () => {
  const resolve = (
    startingHealth: number,
    instances: DamageInstance[],
    { armor = 0, applyGunfireOnHumans = false } = {},
  ) =>
    resolveDamage({ startingHealth, instances, armor, applyGunfireOnHumans });

  it("subtracts damage from Health (p. 103 example)", () => {
    const result = resolve(7, [damage(3)]);
    expect(result.finalHealth).toBe(4);
    expect(result.woundState).toBe("ok");
  });

  it("applies the critical hit example (p. 104)", () => {
    const result = resolve(6, [damage(7)]);
    expect(result.finalHealth).toBe(-1);
    expect(result.woundState).toBe("hurt");
  });

  it("subtracts armor from each instance, never below zero", () => {
    const result = resolve(6, [damage(4), damage(1)], { armor: 2 });
    expect(result.steps.map((s) => s.armorReduction)).toEqual([2, 1]);
    expect(result.finalHealth).toBe(4);
  });

  it("treats negative armor (statblock style) as its magnitude", () => {
    expect(resolve(6, [damage(4)], { armor: -1 }).finalHealth).toBe(3);
  });

  describe("gunfire on humans", () => {
    const gunfire = { applyGunfireOnHumans: true };

    it("applies to the burst example (p. 100)", () => {
      // M16 d+0, rolls 5 and 3, guard has Health 6
      const result = resolve(6, [damage(5), damage(3)], gunfire);
      expect(result.steps.map((s) => s.healthAfter)).toEqual([1, -8]);
      expect(result.steps.map((s) => s.gunfireExtra)).toEqual([0, 6]);
      expect(result.woundState).toBe("seriouslyWounded");
    });

    it("applies when landing exactly on 0", () => {
      expect(resolve(7, [damage(7)], gunfire).finalHealth).toBe(-6);
    });

    it("applies to a target who was already Hurt", () => {
      expect(resolve(-2, [damage(1)], gunfire).finalHealth).toBe(-9);
    });

    it("doesn't apply past the Hurt band", () => {
      const result = resolve(3, [damage(10)], gunfire);
      expect(result.finalHealth).toBe(-7);
      expect(result.steps[0].gunfireExtra).toBe(0);
    });

    it("doesn't apply when armor stops the shot", () => {
      const result = resolve(-1, [damage(2)], { ...gunfire, armor: 3 });
      expect(result.finalHealth).toBe(-1);
      expect(result.steps[0].gunfireExtra).toBe(0);
    });

    it("applies to Lethality damage which leaves them Hurt", () => {
      // full-auto example: L1, die 2, Health 7 -> 7 damage -> 0 -> -6
      const result = resolve(7, [lethal(2)], gunfire);
      expect(result.steps[0].lethality?.outcome).toBe("damage");
      expect(result.finalHealth).toBe(-6);
    });

    it("applies to a Lethality Hurt result", () => {
      const result = resolve(6, [lethal(2, L1H)], gunfire);
      expect(result.steps[0].lethality?.outcome).toBe("hurt");
      expect(result.finalHealth).toBe(-6);
    });
  });

  describe("Lethality", () => {
    it("kills outright", () => {
      const result = resolve(10, [lethal(1)]);
      expect(result.finalHealth).toBe(-12);
      expect(result.woundState).toBe("dead");
    });

    it("applies Lethality instances in order", () => {
      // first leaves them Hurt, so the second H result seriously wounds
      const result = resolve(6, [lethal(2, L1H), lethal(2, L1H)]);
      expect(result.steps.map((s) => s.lethality?.outcome)).toEqual([
        "hurt",
        "seriouslyWounded",
      ]);
      expect(result.finalHealth).toBe(-6);
    });

    it("reduces the damage band by armor", () => {
      const result = resolve(10, [lethal(3)], { armor: 2 });
      expect(result.steps[0].rolled).toBe(8);
      expect(result.steps[0].armorReduction).toBe(2);
      expect(result.finalHealth).toBe(4);
    });
  });

  it("does nothing with no instances", () => {
    const result = resolve(5, [], { applyGunfireOnHumans: true });
    expect(result.finalHealth).toBe(5);
    expect(result.steps).toEqual([]);
  });
});
