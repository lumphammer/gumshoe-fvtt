import { describe, expect, it } from "vitest";

import type { TargetActorInfo } from "./resolveAttackTarget";
import { resolveAttackTarget } from "./resolveAttackTarget";
import type { AttackData, AttackTargetData } from "./types";

const makeAttack = (overrides: Partial<AttackData> = {}): AttackData => ({
  hitTotal: 4,
  hitDie: 4,
  attackerIsHurt: false,
  isGunfire: true,
  damageFormula: "1d6",
  damageParams: {},
  unusedDamageRolls: [],
  targets: [],
  ...overrides,
});

const makeTarget = (
  overrides: Partial<AttackTargetData> = {},
): AttackTargetData => ({
  id: "t1",
  tokenUuid: "Scene.x.Token.y",
  name: "Guard",
  img: "",
  cover: "partial",
  armorOverride: null,
  damageRolls: [{ die: 5, total: 5 }],
  applied: null,
  ...overrides,
});

const human: TargetActorInfo = {
  hitThreshold: 3,
  armor: null,
  health: 6,
  isHuman: true,
};

const options = { useCriticalHits: true, useGunfireOnHumans: true };

describe("resolveAttackTarget", () => {
  it("resolves a plain hit", () => {
    const result = resolveAttackTarget(
      makeAttack(),
      makeTarget(),
      human,
      options,
    );
    expect(result.isHit).toBe(true);
    expect(result.isCritical).toBe(false);
    expect(result.damage?.finalHealth).toBe(1);
  });

  it("misses when cover raises the Hit Threshold", () => {
    const result = resolveAttackTarget(
      makeAttack({ hitTotal: 3 }),
      makeTarget({ cover: "full" }),
      human,
      options,
    );
    expect(result.hitThreshold).toBe(4);
    expect(result.isHit).toBe(false);
    expect(result.damage).toBeNull();
  });

  it("raises the Hit Threshold when the attacker is Hurt", () => {
    const result = resolveAttackTarget(
      makeAttack({ hitTotal: 3, attackerIsHurt: true }),
      makeTarget(),
      human,
      options,
    );
    expect(result.isHit).toBe(false);
  });

  it("defaults the Hit Threshold to 3 when the target has none", () => {
    const result = resolveAttackTarget(
      makeAttack({ hitTotal: 3 }),
      makeTarget(),
      { ...human, hitThreshold: null },
      options,
    );
    expect(result.hitThreshold).toBe(3);
    expect(result.isHit).toBe(true);
  });

  it("asks for a second roll on a critical hit", () => {
    const result = resolveAttackTarget(
      makeAttack({ hitTotal: 9, hitDie: 6 }),
      makeTarget(),
      human,
      options,
    );
    expect(result.isCritical).toBe(true);
    expect(result.missingRollCount).toBe(1);
    expect(result.damage).toBeNull();
  });

  it("adds both rolls together on a critical hit", () => {
    const result = resolveAttackTarget(
      makeAttack({ hitTotal: 9, hitDie: 6 }),
      makeTarget({
        damageRolls: [
          { die: 5, total: 3 },
          { die: 6, total: 4 },
        ],
      }),
      { ...human, health: 6 },
      { ...options, useGunfireOnHumans: false },
    );
    expect(result.damage?.finalHealth).toBe(-1);
  });

  it("ignores critical hits when the option is off", () => {
    const result = resolveAttackTarget(
      makeAttack({ hitTotal: 9, hitDie: 6 }),
      makeTarget(),
      human,
      { ...options, useCriticalHits: false },
    );
    expect(result.isCritical).toBe(false);
    expect(result.missingRollCount).toBe(0);
  });

  it("applies gunfire only to humans, from guns, with the option on", () => {
    const shot = (
      attack: Partial<AttackData>,
      info: Partial<TargetActorInfo>,
      useGunfireOnHumans: boolean,
    ) =>
      resolveAttackTarget(
        makeAttack(attack),
        makeTarget({ damageRolls: [{ die: 6, total: 6 }] }),
        { ...human, ...info },
        { ...options, useGunfireOnHumans },
      ).damage?.finalHealth;

    expect(shot({}, {}, true)).toBe(-6);
    expect(shot({}, { isHuman: false }, true)).toBe(0);
    expect(shot({ isGunfire: false }, {}, true)).toBe(0);
    expect(shot({}, {}, false)).toBe(0);
  });

  it("prefers the armor override to the armor stat", () => {
    const result = resolveAttackTarget(
      makeAttack(),
      makeTarget({ armorOverride: 0 }),
      { ...human, armor: 2 },
      options,
    );
    expect(result.armor).toBe(0);
    expect(result.damage?.finalHealth).toBe(1);
  });

  it("can't resolve damage for a target without Health", () => {
    const result = resolveAttackTarget(
      makeAttack(),
      makeTarget(),
      { ...human, health: null },
      options,
    );
    expect(result.isHit).toBe(true);
    expect(result.damage).toBeNull();
  });
});
