import { describe, expect, it } from "vitest";

import type { TargetActorInfo } from "./resolveAttackTarget";
import { resolveAttackTarget } from "./resolveAttackTarget";
import type { AttackData, AttackTargetData } from "./types";

const makeAttack = (overrides: Partial<AttackData> = {}): AttackData => ({
  fireMode: "single",
  hitTotal: 4,
  hitDie: 4,
  attackerIsHurt: false,
  isGunfire: true,
  lethality: null,
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
  immuneToLethality: false,
};

const options = {
  useCriticalHits: true,
  useGunfireOnHumans: true,
  useLethality: true,
};

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

  describe("three-round burst (p. 100)", () => {
    // Sanchez spends 3 and rolls 5: 8 against the guard's Hit Threshold of 3.
    // The guard has Health 6; the M16 does d+0.
    const burst = makeAttack({ fireMode: "burst", hitTotal: 8, hitDie: 5 });
    const guard = { ...human, health: 6 };

    it("gets one extra bullet for a margin of 5", () => {
      const result = resolveAttackTarget(burst, makeTarget(), guard, options);
      expect(result.bulletCount).toBe(2);
      expect(result.missingRollCount).toBe(1);
    });

    it("applies both bullets, then gunfire on humans", () => {
      const result = resolveAttackTarget(
        burst,
        makeTarget({
          damageRolls: [
            { die: 5, total: 5 },
            { die: 3, total: 3 },
          ],
        }),
        guard,
        options,
      );
      expect(result.damage?.steps.map((s) => s.healthAfter)).toEqual([1, -8]);
      expect(result.damage?.woundState).toBe("seriouslyWounded");
    });

    it("would have got two extra bullets for a margin of 6", () => {
      const result = resolveAttackTarget(
        { ...burst, hitTotal: 9 },
        makeTarget(),
        guard,
        options,
      );
      expect(result.bulletCount).toBe(3);
    });

    it("loses bullets when cover raises the Hit Threshold", () => {
      // margin 4 against Hit Threshold 4
      const result = resolveAttackTarget(
        burst,
        makeTarget({ cover: "full" }),
        guard,
        options,
      );
      expect(result.bulletCount).toBe(2);
      const covered = resolveAttackTarget(
        { ...burst, hitTotal: 6 },
        makeTarget({ cover: "full" }),
        guard,
        options,
      );
      expect(covered.bulletCount).toBe(1);
    });

    it("crits the first bullet", () => {
      // spend 6, roll 6: 12 against 3 is a margin of 9
      const crit = { ...burst, hitTotal: 12, hitDie: 6 };
      const result = resolveAttackTarget(
        crit,
        makeTarget({ damageRolls: [] }),
        guard,
        options,
      );
      expect(result.isCritical).toBe(true);
      expect(result.bulletCount).toBe(3);
      expect(result.missingRollCount).toBe(4);

      const resolved = resolveAttackTarget(
        crit,
        makeTarget({
          damageRolls: [
            { die: 2, total: 2 },
            { die: 3, total: 3 },
            { die: 1, total: 1 },
            { die: 1, total: 1 },
          ],
        }),
        { ...guard, health: 20 },
        options,
      );
      expect(resolved.damage?.steps.map((s) => s.rolled)).toEqual([5, 1, 1]);
      expect(resolved.damage?.finalHealth).toBe(13);
    });

    it("still gives each bullet's damage for a target without Health", () => {
      const crit = { ...burst, hitTotal: 12, hitDie: 6 };
      const resolved = resolveAttackTarget(
        crit,
        makeTarget({
          damageRolls: [
            { die: 2, total: 2 },
            { die: 3, total: 3 },
            { die: 1, total: 1 },
            { die: 4, total: 4 },
          ],
        }),
        { ...guard, health: null },
        options,
      );
      expect(resolved.damage).toBeNull();
      expect(
        resolved.instances.map((i) => [
          i.bullet,
          i.kind === "damage" ? i.amount : null,
        ]),
      ).toEqual([
        [1, 5],
        [2, 1],
        [3, 4],
      ]);
    });
  });
});

describe("full-auto", () => {
  // Sanchez sprays a cellar of cultists with L1 full-auto fire for a result of
  // 3 (p. 100). Each cultist has Health 7. (The book's own tally of who ends
  // up Seriously Wounded is a known erratum.)
  const fullAuto = makeAttack({
    fireMode: "fullAuto",
    hitTotal: 3,
    hitDie: 2,
    lethality: { rating: 1, asterisks: 0, hs: 0 },
  });
  const cultist = { ...human, health: 7 };

  it.each([
    [1, -12],
    // 5 + 2 = 7 damage leaves them at 0, Hurt, so gunfire adds 6
    [2, -6],
    [3, -7],
    [5, -9],
  ])("die %i leaves a cultist at %i", (die, finalHealth) => {
    const result = resolveAttackTarget(
      fullAuto,
      makeTarget({ damageRolls: [{ die, total: die }] }),
      cultist,
      options,
    );
    expect(result.isHit).toBe(true);
    expect(result.bulletCount).toBe(1);
    expect(result.damage?.finalHealth).toBe(finalHealth);
  });

  it("checks each target's own Hit Threshold", () => {
    const result = resolveAttackTarget(
      fullAuto,
      makeTarget({ cover: "full" }),
      cultist,
      options,
    );
    expect(result.isHit).toBe(false);
  });

  it("crits per target", () => {
    // spend 5 from Firearms alone and roll a 6: 11
    const crit = { ...fullAuto, hitTotal: 11, hitDie: 6 };
    const exposed = resolveAttackTarget(
      crit,
      makeTarget({ damageRolls: [], cover: "exposed" }),
      cultist,
      options,
    );
    // Hit Threshold 6, or 7 behind full cover: a margin of only 4
    const behindCover = resolveAttackTarget(
      crit,
      makeTarget({ damageRolls: [], cover: "full" }),
      { ...cultist, hitThreshold: 6 },
      options,
    );
    expect(exposed.isCritical).toBe(true);
    expect(exposed.missingRollCount).toBe(2);
    expect(behindCover.isCritical).toBe(false);
    expect(behindCover.missingRollCount).toBe(1);
  });
});
