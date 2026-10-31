import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../functions/getTranslated", () => ({
  getTranslated: (text: string, values: Record<string, string> = {}) =>
    `${text} ${JSON.stringify(values)}`,
}));

import type { SettingsView } from "../../settings/settingsView";
import type { ItemView, PCView } from "./pcDerived";
import {
  findHealthAbilityIn,
  getBondPointsOf,
  getBondsIn,
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
