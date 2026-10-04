import { describe, expect, it } from "vitest";

import type { Lethality } from "./lethality";
import {
  applyCoverToLethality,
  formatLethality,
  fullAutoLethality,
  getFullAutoLethality,
  getLethalityBand,
  parseLethality,
  resolveLethality,
} from "./lethality";

const L = (text: string): Lethality => {
  const lethality = parseLethality(text);
  if (!lethality) throw new Error(`bad test lethality ${text}`);
  return lethality;
};

const resolve = (
  text: string,
  die: number,
  {
    healthBefore = 6,
    armor = 0,
    immune = false,
  }: { healthBefore?: number; armor?: number; immune?: boolean } = {},
) =>
  resolveLethality({
    lethality: L(text),
    die,
    healthBefore,
    armor,
    immune,
  });

describe("parseLethality / formatLethality", () => {
  it.each([
    ["L1", { rating: 1, asterisks: 0, hs: 0 }],
    ["L2*", { rating: 2, asterisks: 1, hs: 0 }],
    ["L1H", { rating: 1, asterisks: 0, hs: 1 }],
    ["L1**HH", { rating: 1, asterisks: 2, hs: 2 }],
    ["l3*h", { rating: 3, asterisks: 1, hs: 1 }],
    ["2*", { rating: 2, asterisks: 1, hs: 0 }],
    [" L1 * H ", { rating: 1, asterisks: 1, hs: 1 }],
  ])("parses %s", (text, expected) => {
    expect(parseLethality(text)).toEqual(expected);
  });

  it.each(["", "L", "LH", "L1H*", "L-1", "X1", "L1.5"])(
    "rejects %j",
    (text) => {
      expect(parseLethality(text)).toBeNull();
    },
  );

  it("round-trips", () => {
    expect(formatLethality(L("l1**hh"))).toBe("L1**HH");
  });
});

describe("getLethalityBand", () => {
  it.each([
    [1, "kill"],
    [2, "asterisk"],
    [3, "asterisk"],
    [4, "h"],
    [5, "h"],
    [6, "damage"],
  ] as const)("L1**HH on a %i is %s", (die, band) => {
    expect(getLethalityBand(L("L1**HH"), die)).toBe(band);
  });
});

describe("resolveLethality", () => {
  describe("mortar shell, L2 (p. 093)", () => {
    it.each([1, 2])("kills on a %i", (die) => {
      const result = resolve("L2", die);
      expect(result.outcome).toBe("dies");
      expect(result.healthAfter).toBe(-12);
    });

    it("does 13 damage on a 3", () => {
      const result = resolve("L2", 3, { healthBefore: 20 });
      expect(result.outcome).toBe("damage");
      expect(result.rolledDamage).toBe(13);
      expect(result.healthAfter).toBe(7);
    });
  });

  describe("grenade, L1* (p. 093)", () => {
    it("kills on a 1", () => {
      expect(resolve("L1*", 1).outcome).toBe("dies");
    });

    it("seriously wounds on a 2", () => {
      const result = resolve("L1*", 2);
      expect(result.outcome).toBe("seriouslyWounded");
      expect(result.healthAfter).toBe(-6);
    });

    it("kills a target who was already Hurt on a 2", () => {
      expect(resolve("L1*", 2, { healthBefore: -1 }).outcome).toBe("dies");
    });

    it("does 8 damage on a 3", () => {
      const result = resolve("L1*", 3, { healthBefore: 10 });
      expect(result.rolledDamage).toBe(8);
      expect(result.healthAfter).toBe(2);
    });
  });

  describe("a damage roll of 2 (rules summary example)", () => {
    it.each([
      ["L1", "damage"],
      ["L1H", "hurt"],
      ["L1*H", "seriouslyWounded"],
      ["L2H", "dies"],
    ] as const)("%s: %s", (text, outcome) => {
      expect(resolve(text, 2).outcome).toBe(outcome);
    });

    it("L1: takes 7 points of damage", () => {
      expect(resolve("L1", 2).rolledDamage).toBe(7);
    });
  });

  describe("H results on already wounded targets", () => {
    it("makes a Hurt target Seriously Wounded", () => {
      const result = resolve("L1H", 2, { healthBefore: -3 });
      expect(result.outcome).toBe("seriouslyWounded");
      expect(result.healthAfter).toBe(-6);
    });

    it("kills a Seriously Wounded target", () => {
      expect(resolve("L1H", 2, { healthBefore: -7 }).outcome).toBe("dies");
    });

    it("reduces a healthy target to 0", () => {
      expect(resolve("L1H", 2, { healthBefore: 6 }).healthAfter).toBe(0);
    });
  });

  it("never raises Health", () => {
    // already worse off than Seriously Wounded's -6
    expect(resolve("L1*", 2, { healthBefore: -9 }).healthAfter).toBe(-12);
    expect(resolve("L1H", 2, { healthBefore: -4 }).healthAfter).toBe(-6);
  });

  describe("L1**HH", () => {
    it.each([
      [1, "dies"],
      [2, "seriouslyWounded"],
      [3, "seriouslyWounded"],
      [4, "hurt"],
      [5, "hurt"],
      [6, "damage"],
    ] as const)("on a %i: %s", (die, outcome) => {
      expect(resolve("L1**HH", die).outcome).toBe(outcome);
    });

    it("does 11 damage on a 6", () => {
      expect(resolve("L1**HH", 6).rolledDamage).toBe(11);
    });
  });

  describe("armor", () => {
    it("reduces the damage band", () => {
      const result = resolve("L1", 3, { healthBefore: 10, armor: 2 });
      expect(result.armorReduction).toBe(2);
      expect(result.healthAfter).toBe(4);
    });

    it("doesn't save you from the kill band", () => {
      expect(resolve("L1", 1, { armor: 5 }).outcome).toBe("dies");
    });
  });

  describe("immunity (p. 093)", () => {
    it("always takes 5 x rating + die", () => {
      const result = resolve("L2", 1, { healthBefore: 20, immune: true });
      expect(result.outcome).toBe("damage");
      expect(result.rolledDamage).toBe(11);
    });

    it("is still reduced by armor", () => {
      const result = resolve("L2", 1, {
        healthBefore: 20,
        immune: true,
        armor: 3,
      });
      expect(result.healthAfter).toBe(12);
    });
  });
});

describe("applyCoverToLethality", () => {
  it("full cover subtracts 1 from the rating", () => {
    expect(applyCoverToLethality(L("L2*"), "full")).toEqual(L("L1*"));
  });

  it("doesn't go below 0", () => {
    expect(applyCoverToLethality(L("L0H"), "full").rating).toBe(0);
  });

  it("other cover changes nothing", () => {
    expect(applyCoverToLethality(L("L2*"), "partial")).toEqual(L("L2*"));
    expect(applyCoverToLethality(L("L2*"), "exposed")).toEqual(L("L2*"));
  });

  it("an L1 behind full cover can't kill outright", () => {
    const covered = applyCoverToLethality(L("L1"), "full");
    const result = resolveLethality({
      lethality: covered,
      die: 1,
      healthBefore: 6,
      armor: 0,
      immune: false,
    });
    expect(result.outcome).toBe("damage");
    expect(result.rolledDamage).toBe(1);
  });
});

describe("getFullAutoLethality", () => {
  it("is L1 for small arms, whatever their own rating", () => {
    expect(
      getFullAutoLethality({
        weaponFireModes: "selective",
        weaponLethality: L("L2*"),
      }),
    ).toEqual(fullAutoLethality);
  });

  it("is a machine gun's own rating", () => {
    expect(
      getFullAutoLethality({
        weaponFireModes: "alwaysAuto",
        weaponLethality: L("L2"),
      }),
    ).toEqual(L("L2"));
  });

  it("is L1 for a machine gun without a rating", () => {
    expect(
      getFullAutoLethality({
        weaponFireModes: "alwaysAuto",
        weaponLethality: null,
      }),
    ).toEqual(L("L1"));
  });
});
