import { describe, expect, it } from "vitest";

import type { SettingsView } from "../../settings/settingsView";
import {
  getAbilityRowsIn,
  getCategorizedAbilitiesIn,
  getPushPoolIn,
  getPushPoolWarningKeysIn,
  getTrackerAbilitiesIn,
  hasRegularInvestigativeAbilitiesIn,
  sumRatingsIn,
} from "./abilitiesDerived";
import type { ItemView } from "./pcDerived";

const settings = {
  investigativeAbilityCategories: ["Academic", "Interpersonal"],
  generalAbilityCategories: ["General"],
} as unknown as SettingsView;

const item = (
  type: string,
  name: string,
  system: Record<string, unknown>,
): ItemView => ({ _id: name, name, type, system });

const names = (abilities: Record<string, ItemView[]>) =>
  Object.fromEntries(
    Object.entries(abilities).map(([cat, items]) => [
      cat,
      items.map((i) => i.name),
    ]),
  );

describe("getCategorizedAbilitiesIn", () => {
  const items = [
    item("investigativeAbility", "Law", { categoryId: "Academic", rating: 1 }),
    item("investigativeAbility", "Odd", { categoryId: "Other", rating: 1 }),
    item("investigativeAbility", "Hidden", {
      categoryId: "Academic",
      rating: 0,
      hideIfZeroRated: true,
    }),
    item("generalAbility", "Athletics", { categoryId: "General", rating: 3 }),
    item("generalAbility", "Push", {
      categoryId: "General",
      rating: 2,
      isPushPool: true,
    }),
    item("generalAbility", "Loose", { categoryId: "", rating: 1 }),
    item("weapon", "Knife", {}),
  ];

  it("puts every ability in its category, the settings' first", () => {
    const { investigativeAbilities, generalAbilities } =
      getCategorizedAbilitiesIn(
        items,
        { hideZeroRated: false, hidePushPool: false },
        settings,
      );
    expect(names(investigativeAbilities)).toEqual({
      Academic: ["Law", "Hidden"],
      Interpersonal: [],
      Other: ["Odd"],
    });
    expect(names(generalAbilities)).toEqual({
      General: ["Athletics", "Push"],
      Uncategorised: ["Loose"],
    });
  });

  it("can hide zero-rated abilities that ask to be, and the push pool", () => {
    const { investigativeAbilities, generalAbilities } =
      getCategorizedAbilitiesIn(
        items,
        { hideZeroRated: true, hidePushPool: true },
        settings,
      );
    expect(names(investigativeAbilities)["Academic"]).toEqual(["Law"]);
    expect(names(generalAbilities)["General"]).toEqual(["Athletics"]);
  });
});

describe("push pools", () => {
  it("finds the push pool, and warns about how they're set up", () => {
    const pool = item("generalAbility", "Push", { isPushPool: true });
    const quickShock = item("investigativeAbility", "Fast", {
      isQuickShock: true,
    });
    expect(getPushPoolIn([quickShock, pool])).toBe(pool);
    expect(getPushPoolIn([quickShock])).toBeUndefined();
    expect(getPushPoolWarningKeysIn([pool, quickShock])).toEqual([]);
    expect(getPushPoolWarningKeysIn([quickShock])).not.toEqual([]);
    expect(getPushPoolWarningKeysIn([pool, pool])).not.toEqual([]);
  });
});

describe("getTrackerAbilitiesIn", () => {
  it("lists abilities with trackers, the push pool first, then by name", () => {
    const items = [
      item("generalAbility", "Health", { showTracker: true }),
      item("generalAbility", "Athletics", { showTracker: false }),
      item("investigativeAbility", "Cop Talk", { showTracker: true }),
      item("generalAbility", "Push", { showTracker: true, isPushPool: true }),
      item("equipment", "Torch", { showTracker: true }),
    ];
    expect(getTrackerAbilitiesIn(items).map((i) => i.name)).toEqual([
      "Push",
      "Cop Talk",
      "Health",
    ]);
  });
});

describe("ability rows", () => {
  const abilities = {
    Academic: [
      item("investigativeAbility", "Law", { rating: 2 }),
      item("investigativeAbility", "Art", { rating: 1, isQuickShock: true }),
    ],
    General: [item("generalAbility", "Athletics", { rating: 4 })],
  };

  it("lists each category's abilities by name", () => {
    expect(getAbilityRowsIn(abilities)).toEqual({
      Academic: [
        { id: "Art", isQuickShock: true },
        { id: "Law", isQuickShock: false },
      ],
      General: [{ id: "Athletics", isQuickShock: false }],
    });
  });

  it("adds up their ratings", () => {
    expect(sumRatingsIn(abilities)).toBe(7);
  });

  it("knows whether any investigative ability isn't quick-shock", () => {
    expect(hasRegularInvestigativeAbilitiesIn(abilities.Academic)).toBe(true);
    expect(
      hasRegularInvestigativeAbilitiesIn(abilities.Academic.slice(1)),
    ).toBe(false);
  });
});
