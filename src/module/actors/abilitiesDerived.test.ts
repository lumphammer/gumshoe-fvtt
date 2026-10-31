import { describe, expect, it } from "vitest";

import type { SettingsView } from "../../settings/settingsView";
import {
  getCategorizedAbilitiesIn,
  getPushPoolIn,
  getPushPoolWarningKeysIn,
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
