import { describe, expect, it } from "vitest";

import {
  findGeneralAbilityIn,
  getGeneralAbilityNamesIn,
  getPoolOf,
} from "./findGeneralAbility";

const items = [
  { type: "investigativeAbility", name: "Firearms", system: { pool: 9 } },
  { type: "generalAbility", name: "Firearms", system: { pool: 3 } },
  { type: "weapon", name: "Pistol", system: {} },
  { type: "generalAbility", name: "Athletics", system: { pool: 0 } },
];

describe("findGeneralAbilityIn", () => {
  it("finds general abilities only, by name", () => {
    expect(findGeneralAbilityIn(items, "Firearms")).toBe(items[1]);
    expect(findGeneralAbilityIn(items, "Pistol")).toBeUndefined();
    expect(findGeneralAbilityIn(items, "Stealth")).toBeUndefined();
  });
});

describe("getGeneralAbilityNamesIn", () => {
  it("lists the general abilities' names", () => {
    expect(getGeneralAbilityNamesIn(items)).toEqual(["Firearms", "Athletics"]);
  });
});

describe("getPoolOf", () => {
  it("is an ability's pool, or 0", () => {
    expect(getPoolOf(items[1])).toBe(3);
    expect(getPoolOf(items[2])).toBe(0);
    expect(getPoolOf(undefined)).toBe(0);
  });
});
