import { describe, expect, it } from "vitest";

import type { TargetActorInfo } from "./resolveAttackTarget";
import {
  getBurstBulletsFired,
  resolveAttackTarget,
  resolveAttackTargetInAttack,
} from "./resolveAttackTarget";
import type { AttackData, AttackTargetData } from "./types";

const makeAttack = (overrides: Partial<AttackData> = {}): AttackData => ({
  fireMode: "single",
  hitTotal: 4,
  hitDie: 4,
  attackerIsHurt: false,
  isGunfire: true,
  isShotDry: false,
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
  shotDryBonus: false,
  walked: false,
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

describe("Shot Dry", () => {
  const shotDry = makeAttack({
    fireMode: "fullAuto",
    // spend 1, roll 6: a margin of 4 against Hit Threshold 3, so no crit
    hitTotal: 7,
    hitDie: 6,
    isShotDry: true,
    lethality: { rating: 1, asterisks: 0, hs: 0 },
  });
  const a = makeTarget({ id: "a", damageRolls: [] });
  const b = makeTarget({
    id: "b",
    tokenUuid: "Scene.x.Token.b",
    damageRolls: [],
  });
  const c = makeTarget({
    id: "c",
    tokenUuid: "Scene.x.Token.c",
    damageRolls: [],
  });

  it("gives a lone target three dice", () => {
    const result = resolveAttackTarget(
      { ...shotDry, targets: [a] },
      a,
      human,
      options,
    );
    expect(result.shotDryExtraDice).toBe(2);
    expect(result.missingRollCount).toBe(3);
  });

  it("gives two chosen targets two dice each", () => {
    const chosenA = { ...a, shotDryBonus: true };
    const chosenB = { ...b, shotDryBonus: true };
    const attack = { ...shotDry, targets: [chosenA, chosenB, c] };
    expect(
      resolveAttackTarget(attack, chosenA, human, options).missingRollCount,
    ).toBe(2);
    expect(
      resolveAttackTarget(attack, chosenB, human, options).missingRollCount,
    ).toBe(2);
    expect(
      resolveAttackTarget(attack, c, human, options).missingRollCount,
    ).toBe(1);
  });

  it("gives one chosen target among several three dice", () => {
    const chosenA = { ...a, shotDryBonus: true };
    const attack = { ...shotDry, targets: [chosenA, b] };
    expect(
      resolveAttackTarget(attack, chosenA, human, options).missingRollCount,
    ).toBe(3);
    expect(
      resolveAttackTarget(attack, b, human, options).missingRollCount,
    ).toBe(1);
  });

  it("gives nothing with several targets and none chosen", () => {
    const attack = { ...shotDry, targets: [a, b] };
    expect(
      resolveAttackTarget(attack, a, human, options).shotDryExtraDice,
    ).toBe(0);
  });

  it("only honours the first two chosen", () => {
    const targets = [a, b, c].map((t) => ({ ...t, shotDryBonus: true }));
    const attack = { ...shotDry, targets };
    expect(
      targets.map(
        (t) => resolveAttackTarget(attack, t, human, options).shotDryExtraDice,
      ),
    ).toEqual([1, 1, 0]);
  });

  it("gives nothing to a target it misses", () => {
    const behindCover = { ...a, cover: "full" as const };
    const result = resolveAttackTarget(
      { ...shotDry, targets: [behindCover] },
      behindCover,
      { ...human, hitThreshold: 7 },
      options,
    );
    expect(result.isHit).toBe(false);
    expect(result.shotDryExtraDice).toBe(0);
  });

  it("stacks with a crit", () => {
    // spend 5, roll 6: 11, a margin of 8
    const crit = { ...shotDry, hitTotal: 11, targets: [a] };
    const result = resolveAttackTarget(crit, a, human, options);
    expect(result.isCritical).toBe(true);
    expect(result.missingRollCount).toBe(4);
  });
});

describe("walking fire", () => {
  // Sanchez's full-auto result of 3 hits Aquarius X (Hit Threshold 3), but
  // not Virgo behind cover (Hit Threshold 4) (p. 100)
  it("needs the original result to hit the new target", () => {
    const attack = makeAttack({
      fireMode: "fullAuto",
      hitTotal: 3,
      hitDie: 2,
      lethality: { rating: 1, asterisks: 0, hs: 0 },
    });
    const aquarius = makeTarget({ id: "aquarius", walked: true });
    const virgo = makeTarget({ id: "virgo", walked: true, cover: "full" });
    expect(resolveAttackTarget(attack, aquarius, human, options).isHit).toBe(
      true,
    );
    expect(resolveAttackTarget(attack, virgo, human, options).isHit).toBe(
      false,
    );
  });

  describe("a burst walked across targets", () => {
    const first = makeTarget({ id: "first", damageRolls: [] });
    const second = makeTarget({
      id: "second",
      tokenUuid: "Scene.x.Token.second",
      walked: true,
      damageRolls: [],
    });
    const third = makeTarget({
      id: "third",
      tokenUuid: "Scene.x.Token.third",
      walked: true,
      damageRolls: [],
    });
    const infoFor = () => human;

    it("shares out no more than three bullets", () => {
      // margin 4 against Hit Threshold 3: two bullets each, if they had them
      const burst = makeAttack({
        fireMode: "burst",
        hitTotal: 7,
        hitDie: 4,
        targets: [first, second, third],
      });
      const counts = [first, second, third].map(
        (t) =>
          resolveAttackTargetInAttack(burst, t, infoFor, options).bulletCount,
      );
      expect(counts).toEqual([2, 1, 0]);
      expect(getBurstBulletsFired(burst, infoFor, options)).toBe(3);
    });

    it("leaves a target with no bullets without damage", () => {
      // margin 6: all three bullets hit the first target
      const burst = makeAttack({
        fireMode: "burst",
        hitTotal: 9,
        hitDie: 6,
        targets: [first, second],
      });
      const result = resolveAttackTargetInAttack(
        burst,
        { ...second, damageRolls: [{ die: 4, total: 4 }] },
        infoFor,
        options,
      );
      expect(result.isHit).toBe(true);
      expect(result.bulletCount).toBe(0);
      expect(result.isCritical).toBe(false);
      expect(result.missingRollCount).toBe(0);
      expect(result.damage).toBeNull();
    });

    it("doesn't count bullets which missed", () => {
      // 4 misses the first target (Hit Threshold 6) and hits the second
      const burst = makeAttack({
        fireMode: "burst",
        hitTotal: 4,
        hitDie: 1,
        targets: [first, second],
      });
      const firstIsTough = (t: AttackTargetData) =>
        t.id === "first" ? { ...human, hitThreshold: 6 } : human;
      expect(
        resolveAttackTargetInAttack(burst, second, firstIsTough, options)
          .bulletCount,
      ).toBe(1);
      expect(getBurstBulletsFired(burst, firstIsTough, options)).toBe(1);
    });

    it("resolves a target not yet added as if it came last", () => {
      const burst = makeAttack({
        fireMode: "burst",
        hitTotal: 7,
        hitDie: 4,
        targets: [first],
      });
      expect(
        resolveAttackTargetInAttack(burst, second, infoFor, options)
          .bulletCount,
      ).toBe(1);
    });
  });
});
