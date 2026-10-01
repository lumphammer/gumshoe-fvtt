import { describe, expect, it } from "vitest";

import {
  removeTarget,
  setSingleTarget,
  takeUnusedDamageRolls,
} from "./attackData";
import type { AttackData, AttackTargetData } from "./types";

const attack: AttackData = {
  hitTotal: 6,
  hitDie: 6,
  attackerIsHurt: false,
  isGunfire: true,
  lethality: null,
  damageFormula: "1d6 + @damage",
  damageParams: { damage: 2 },
  unusedDamageRolls: [{ die: 6, total: 8 }],
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

describe("takeUnusedDamageRolls", () => {
  it("gives the attack's damage roll to a target which needs one", () => {
    const result = takeUnusedDamageRolls(attack, target, 1);
    expect(result.target.damageRolls).toEqual([{ die: 6, total: 8 }]);
    expect(result.attack.unusedDamageRolls).toEqual([]);
  });

  it("leaves it alone for a target which doesn't need damage", () => {
    const result = takeUnusedDamageRolls(attack, target, 0);
    expect(result.target.damageRolls).toEqual([]);
    expect(result.attack.unusedDamageRolls).toEqual([{ die: 6, total: 8 }]);
  });

  it("only gives it out once", () => {
    const first = takeUnusedDamageRolls(attack, target, 1);
    const second = takeUnusedDamageRolls(
      first.attack,
      { ...target, id: "t2" },
      1,
    );
    expect(second.target.damageRolls).toEqual([]);
  });

  it("only gives out as many as are needed", () => {
    const result = takeUnusedDamageRolls(
      {
        ...attack,
        unusedDamageRolls: [
          { die: 6, total: 8 },
          { die: 2, total: 4 },
        ],
      },
      target,
      1,
    );
    expect(result.target.damageRolls).toEqual([{ die: 6, total: 8 }]);
    expect(result.attack.unusedDamageRolls).toEqual([{ die: 2, total: 4 }]);
  });
});

describe("removeTarget", () => {
  it("returns the target's damage rolls to the attack", () => {
    const withTarget = {
      ...attack,
      unusedDamageRolls: [],
      targets: [
        {
          ...target,
          damageRolls: [
            { die: 6, total: 8 },
            { die: 2, total: 4 },
          ],
        },
      ],
    };
    const result = removeTarget(withTarget, "t1");
    expect(result.targets).toEqual([]);
    expect(result.unusedDamageRolls).toEqual([
      { die: 6, total: 8 },
      { die: 2, total: 4 },
    ]);
  });

  it("gives the same damage back when the target is re-added", () => {
    const added = takeUnusedDamageRolls(attack, target, 1);
    const removed = removeTarget(
      { ...added.attack, targets: [added.target] },
      "t1",
    );
    const readded = takeUnusedDamageRolls(removed, { ...target, id: "t2" }, 1);
    expect(readded.target.damageRolls).toEqual([{ die: 6, total: 8 }]);
  });

  it("does nothing for an unknown target", () => {
    expect(removeTarget(attack, "nope")).toBe(attack);
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
      { ...attack, unusedDamageRolls: [], targets: [existing] },
      replacement,
    );
    expect(result.targets).toHaveLength(1);
    expect(result.targets[0].id).toBe("t2");
    expect(result.targets[0].damageRolls).toEqual([{ die: 6, total: 8 }]);
  });
});
