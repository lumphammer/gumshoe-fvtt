import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../functions/getTranslated", () => ({
  getTranslated: (text: string, values: Record<string, string> = {}) =>
    `${text} ${JSON.stringify(values)}`,
}));

import type { SettingsView } from "../../settings/settingsView";
import type { ItemView, PCView } from "./pcDerived";
import {
  findHealthAbilityIn,
  getAdaptedTraumaNamesIn,
  getBondCapIn,
  getBondPointsOf,
  getBondsIn,
  getNeglectableBondsIn,
  getRebuildSpendAbilitiesIn,
  getReformableBondsIn,
  getStabilityTestDifficultyIn,
  getRatingCapIn,
  getRatingCapsIn,
  getStabilityStateIn,
  getTraumaTestDifficultyIn,
  isAdaptedToIn,
} from "./pcDerived";

const violence = {
  id: "violence",
  name: "Violence",
  difficulty: 3,
  adaptedDifficulty: 2,
  causesSanityLoss: false,
  useAdaptation: true,
  cappedAbilities: ["Sympathy"],
  capsBonds: false,
  refreshPenalty: 0,
};

const settings = {
  useStabilityRules: true,
  useStabilityStates: true,
  useBonds: true,
  useTrauma: true,
  useSanityRules: true,
  stabilityAbility: "Stability",
  stabilityStates: {
    shaken: { name: "Shaken", upTo: 0 },
    shattered: { name: "Shattered", upTo: -6 },
    gone: { name: "Gone", upTo: -12 },
  },
  traumaTypes: [violence],
  sanityAbility: "Sanity",
  sanityCapBase: 10,
  sanityCapAbility: "Cthulhu Mythos",
} as unknown as SettingsView;

const item = (
  type: string,
  name: string,
  system: Record<string, unknown>,
): ItemView => ({ _id: name, name, type, system });

const pc = (
  items: ItemView[],
  adaptations: Record<string, number> = {},
): PCView => ({ system: { adaptations }, items });

beforeEach(() => {
  vi.stubGlobal("game", { i18n: { lang: "en" } });
});

describe("getStabilityStateIn", () => {
  it("is the state of the Stability ability's pool", () => {
    const stability = (pool: number) =>
      pc([item("generalAbility", "Stability", { pool })]);
    expect(getStabilityStateIn(stability(5), settings)).toBe("steady");
    expect(getStabilityStateIn(stability(0), settings)).toBe("shaken");
    expect(getStabilityStateIn(stability(-7), settings)).toBe("shattered");
    expect(getStabilityStateIn(stability(-12), settings)).toBe("gone");
  });

  it("is null with no Stability ability, or states off", () => {
    expect(getStabilityStateIn(pc([]), settings)).toBeNull();
    expect(
      getStabilityStateIn(
        pc([item("generalAbility", "Stability", { pool: 0 })]),
        { ...settings, useStabilityStates: false },
      ),
    ).toBeNull();
  });
});

describe("rating caps", () => {
  it("caps abilities capped by an adaptation", () => {
    const adapted = pc([], { violence: 3 });
    expect(isAdaptedToIn(adapted, "violence", settings)).toBe(true);
    expect(getRatingCapIn(adapted, "Sympathy", settings)).toBe(1);
    expect(getRatingCapsIn(adapted, "Sympathy", settings)[0]?.reason).toBe(
      'AdaptedToTrauma {"Trauma":"Violence"}',
    );
    expect(getRatingCapIn(adapted, "Athletics", settings)).toBeNull();
    expect(getRatingCapIn(pc([]), "Sympathy", settings)).toBeNull();
  });

  it("caps Sanity by the cap ability's rating", () => {
    const mythos = pc([
      item("investigativeAbility", "Cthulhu Mythos", { rating: 3 }),
    ]);
    expect(getRatingCapIn(mythos, "Sanity", settings)).toBe(7);
    expect(
      getRatingCapIn(mythos, "Sanity", { ...settings, useSanityRules: false }),
    ).toBeNull();
  });
});

describe("Bonds", () => {
  it("are in display order: ordinary first, then DELTA GREEN, by name", () => {
    const items = [
      item("bond", "Zoe", { points: 5, isDeltaGreen: false }),
      item("bond", "Handler", { points: 5, isDeltaGreen: true }),
      item("generalAbility", "Athletics", {}),
      item("bond", "Alex", { points: -1, isDeltaGreen: false }),
    ];
    expect(getBondsIn(items).map((bond) => bond.name)).toEqual([
      "Alex",
      "Zoe",
      "Handler",
    ]);
    expect(getBondPointsOf(items[0])).toEqual({
      points: 5,
      isBroken: false,
    });
    expect(getBondPointsOf(items[3])).toEqual({
      points: -1,
      isBroken: true,
    });
  });
});

describe("establishing a Bond", () => {
  const items = [
    item("bond", "Zoe", { points: 5, isDeltaGreen: false }),
    item("bond", "Handler", { points: 5, isDeltaGreen: true }),
    item("bond", "Alex", { points: -1, isDeltaGreen: false }),
    item("bond", "Old Handler", { points: -1, isDeltaGreen: true }),
    item("investigativeAbility", "Reassurance", {
      categoryId: "Interpersonal",
      rating: 2,
    }),
    item("investigativeAbility", "Flattery", {
      categoryId: "Interpersonal",
      rating: 1,
    }),
    item("investigativeAbility", "Bureaucracy", {
      categoryId: "Interpersonal",
      rating: 0,
    }),
    item("investigativeAbility", "Accounting", {
      categoryId: "Academic",
      rating: 3,
    }),
  ];
  const names = (list: ItemView[]) => list.map((i) => i.name);

  it("neglects ordinary Bonds that aren't broken", () => {
    expect(names(getNeglectableBondsIn(items))).toEqual(["Zoe"]);
  });

  it("re-forms ordinary Bonds that are broken", () => {
    expect(names(getReformableBondsIn(items))).toEqual(["Alex"]);
  });

  it("spends abilities rated in the setting's category, by name", () => {
    const s = { bondRebuildSpendCategory: "Interpersonal" } as SettingsView;
    expect(names(getRebuildSpendAbilitiesIn(items, s))).toEqual([
      "Flattery",
      "Reassurance",
    ]);
    expect(
      names(
        getRebuildSpendAbilitiesIn(items, {
          bondRebuildSpendCategory: "Academic",
        } as SettingsView),
      ),
    ).toEqual(["Accounting"]);
  });
});

describe("adaptations and the Bond cap", () => {
  const capping = {
    ...violence,
    id: "helplessness",
    name: "Helplessness",
    capsBonds: true,
  };
  const s = { ...settings, traumaTypes: [violence, capping] } as SettingsView;

  it("names what the Agent has adapted to", () => {
    const adapted = pc([], { violence: 3, helplessness: 3 });
    expect(getAdaptedTraumaNamesIn(adapted, undefined, s)).toEqual([
      "Violence",
      "Helplessness",
    ]);
    expect(
      getAdaptedTraumaNamesIn(adapted, (type) => type.capsBonds, s),
    ).toEqual(["Helplessness"]);
    expect(
      getAdaptedTraumaNamesIn(pc([], { violence: 2 }), undefined, s),
    ).toEqual([]);
  });

  it("caps Bonds at 2 when adapted to something that caps them", () => {
    expect(getBondCapIn(pc([], { helplessness: 3 }), s)).toBe(2);
    expect(getBondCapIn(pc([], { violence: 3 }), s)).toBeGreaterThan(2);
  });
});

describe("getStabilityTestDifficultyIn", () => {
  it("is 1 more while Shaken or worse", () => {
    const stability = (pool: number) =>
      pc([item("generalAbility", "Stability", { pool })]);
    expect(getStabilityTestDifficultyIn(stability(5), 4, settings)).toBe(4);
    expect(getStabilityTestDifficultyIn(stability(0), 4, settings)).toBe(5);
    expect(
      getStabilityTestDifficultyIn(stability(0), 4, {
        ...settings,
        useStabilityStates: false,
      }),
    ).toBe(4);
  });
});

describe("findHealthAbilityIn", () => {
  it("prefers the ability linked to the health resource", () => {
    const linked = item("generalAbility", "Vigour", {
      linkToResource: true,
      resourceId: "health",
    });
    const named = item("generalAbility", "Health", {});
    expect(findHealthAbilityIn([named, linked])).toBe(linked);
    expect(findHealthAbilityIn([named])).toBe(named);
    expect(findHealthAbilityIn([])).toBeUndefined();
  });
});

describe("getTraumaTestDifficultyIn", () => {
  it("is the trauma's Difficulty, less if adapted, more if Shaken", () => {
    const stability = (pool: number) =>
      item("generalAbility", "Stability", { pool });
    expect(
      getTraumaTestDifficultyIn(pc([stability(5)]), violence, settings),
    ).toBe(3);
    expect(
      getTraumaTestDifficultyIn(
        pc([stability(5)], { violence: 3 }),
        violence,
        settings,
      ),
    ).toBe(2);
    expect(
      getTraumaTestDifficultyIn(pc([stability(0)]), violence, settings),
    ).toBe(4);
    expect(getTraumaTestDifficultyIn(pc([]), violence, settings)).toBeNull();
  });
});
