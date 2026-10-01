import { describe, expect, it } from "vitest";

import { setSingleTarget, takeUnusedDamageRoll } from "./attackData";
import type { AttackFlagData, AttackTargetData } from "./types";

const attack: AttackFlagData = {
  version: 1,
  hitTotal: 6,
  hitDie: 6,
  attackerIsHurt: false,
  isGunfire: true,
  damageFormula: "1d6 + @damage",
  damageParams: { damage: 2 },
  unusedDamageRoll: { die: 6, total: 8 },
  targets: [],
};

const target: AttackTargetData = {
  id: "t1",
  tokenUuid: "Scene.x.Token.y",
  name: "Brave Thuggo",
  img: "",
  cover: "partial",
  armorOverride: null,
  damageRolls: [],
  applied: null,
};

describe("takeUnusedDamageRoll", () => {
  it("gives the attack's damage roll to a target which needs one", () => {
    const result = takeUnusedDamageRoll(attack, target, 1);
    expect(result.target.damageRolls).toEqual([{ die: 6, total: 8 }]);
    expect(result.attack.unusedDamageRoll).toBeNull();
  });

  it("leaves it alone for a target which doesn't need damage", () => {
    const result = takeUnusedDamageRoll(attack, target, 0);
    expect(result.target.damageRolls).toEqual([]);
    expect(result.attack.unusedDamageRoll).toEqual({ die: 6, total: 8 });
  });

  it("only gives it out once", () => {
    const first = takeUnusedDamageRoll(attack, target, 1);
    const second = takeUnusedDamageRoll(
      first.attack,
      { ...target, id: "t2" },
      1,
    );
    expect(second.target.damageRolls).toEqual([]);
  });

  it("copes with attacks from before the roll was stored", () => {
    const { unusedDamageRoll: _, ...oldAttack } = attack;
    const result = takeUnusedDamageRoll(oldAttack, target, 1);
    expect(result.target.damageRolls).toEqual([]);
  });
});

describe("setSingleTarget", () => {
  it("adds a target when there are none", () => {
    const result = setSingleTarget(attack, target);
    expect(result.targets).toEqual([target]);
  });

  it("replaces the existing target, keeping its damage rolls", () => {
    const existing = {
      ...target,
      damageRolls: [{ die: 6, total: 8 }],
    };
    const replacement = { ...target, id: "t2", name: "Distracted Thuggo" };
    const result = setSingleTarget(
      { ...attack, unusedDamageRoll: null, targets: [existing] },
      replacement,
    );
    expect(result.targets).toHaveLength(1);
    expect(result.targets[0].id).toBe("t2");
    expect(result.targets[0].damageRolls).toEqual([{ die: 6, total: 8 }]);
  });
});
