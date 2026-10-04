import { describe, expect, it } from "vitest";

import {
  getAvailableFireModes,
  getEffectiveHitThreshold,
  getMinimumSpend,
  getWastedExtraSpend,
  getRequiredDamageRollCount,
  getWoundState,
  canWalkFireFrom,
  getBurstBulletCount,
  getJamUpdate,
  getWalkingFirePayments,
  getShotDryExtraDice,
  isCriticalHit,
  isSamePendingJam,
  isShotDry,
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

describe("getWastedExtraSpend", () => {
  it.each([
    // 1 Firearms + 2 Stability + 2 Athletics: exactly 5 (Sanchez, p. 100)
    [1, 4, 0],
    // 4 Firearms + 3 Stability: only 1 was needed
    [4, 3, 2],
    // Firearms alone is enough, so any extra is wasted
    [5, 2, 2],
    [6, 1, 1],
    // short of the minimum: nothing wasted (the attack can't be made anyway)
    [1, 2, 0],
    [0, 0, 0],
  ])("spend %i and %i extra: %i wasted", (spend, extraSpend, expected) => {
    expect(getWastedExtraSpend({ spend, extraSpend, minimumSpend: 5 })).toBe(
      expected,
    );
  });
});

describe("isShotDry", () => {
  it("is an unmodified 6 on full-auto", () => {
    expect(isShotDry({ fireMode: "fullAuto", hitDie: 6 })).toBe(true);
    expect(isShotDry({ fireMode: "fullAuto", hitDie: 5 })).toBe(false);
    expect(isShotDry({ fireMode: "burst", hitDie: 6 })).toBe(false);
    expect(isShotDry({ fireMode: "single", hitDie: 6 })).toBe(false);
  });
});

describe("getShotDryExtraDice", () => {
  it("gives a lone chosen target two extra dice (three in all)", () => {
    expect(getShotDryExtraDice(1)).toBe(2);
  });

  it("gives two chosen targets one extra die each", () => {
    expect(getShotDryExtraDice(2)).toBe(1);
  });

  it("gives nothing with no targets chosen", () => {
    expect(getShotDryExtraDice(0)).toBe(0);
  });
});

describe("getJamUpdate", () => {
  const fullAuto = { fireMode: "fullAuto" as const, combatId: "c1" };

  it("notes a first 1 on full-auto", () => {
    expect(getJamUpdate({ ...fullAuto, hitDie: 1, pendingJam: null })).toEqual({
      jams: false,
      pendingJam: { combatId: "c1" },
    });
  });

  it("jams on a second 1 in the same fight", () => {
    expect(
      getJamUpdate({ ...fullAuto, hitDie: 1, pendingJam: { combatId: "c1" } }),
    ).toEqual({ jams: true, pendingJam: null });
  });

  it("jams on two 1s in a row outside combat", () => {
    expect(
      getJamUpdate({
        fireMode: "fullAuto",
        hitDie: 1,
        combatId: null,
        pendingJam: { combatId: null },
      }),
    ).toEqual({ jams: true, pendingJam: null });
  });

  it("starts again in a new fight", () => {
    expect(
      getJamUpdate({ ...fullAuto, hitDie: 1, pendingJam: { combatId: "c0" } }),
    ).toEqual({ jams: false, pendingJam: { combatId: "c1" } });
    expect(
      getJamUpdate({ ...fullAuto, hitDie: 1, pendingJam: { combatId: null } }),
    ).toEqual({ jams: false, pendingJam: { combatId: "c1" } });
  });

  it("resets on any other roll", () => {
    expect(
      getJamUpdate({ ...fullAuto, hitDie: 2, pendingJam: { combatId: "c1" } }),
    ).toEqual({ jams: false, pendingJam: null });
  });

  it("resets on a single shot or burst, even a 1", () => {
    for (const fireMode of ["single", "burst"] as const) {
      expect(
        getJamUpdate({
          fireMode,
          hitDie: 1,
          combatId: "c1",
          pendingJam: { combatId: "c1" },
        }),
      ).toEqual({ jams: false, pendingJam: null });
    }
  });
});

describe("isSamePendingJam", () => {
  it.each([
    [null, null, true],
    [null, { combatId: null }, false],
    [{ combatId: null }, { combatId: null }, true],
    [{ combatId: "a" }, { combatId: "a" }, true],
    [{ combatId: "a" }, { combatId: "b" }, false],
  ])("%j and %j: %s", (a, b, expected) => {
    expect(isSamePendingJam(a, b)).toBe(expected);
  });
});

describe("getWalkingFirePayments", () => {
  it("offers 2 of the weapon's ability, or 1 and 2 of each other", () => {
    expect(
      getWalkingFirePayments({
        weaponPool: 3,
        otherAbilities: [{ name: "Athletics", pool: 2 }],
      }),
    ).toEqual([
      { weaponSpend: 2, other: null, affordable: true },
      {
        weaponSpend: 1,
        other: { name: "Athletics", spend: 2 },
        affordable: true,
      },
    ]);
  });

  it("marks what can't be afforded", () => {
    // Sanchez, down to 1 Firearms, pays 1 Firearms and 2 Athletics (p. 100)
    const payments = getWalkingFirePayments({
      weaponPool: 1,
      otherAbilities: [
        { name: "Athletics", pool: 2 },
        { name: "Stability", pool: 1 },
      ],
    });
    expect(payments.map((p) => p.affordable)).toEqual([false, true, false]);
  });
});

describe("canWalkFireFrom", () => {
  it("is bursts and full-auto", () => {
    expect(canWalkFireFrom("burst")).toBe(true);
    expect(canWalkFireFrom("fullAuto")).toBe(true);
    expect(canWalkFireFrom("single")).toBe(false);
  });
});
