import { describe, expect, it } from "vitest";

import { canMakeAbilityTestEdit, isAbilityTestEdit } from "./abilityTestEdits";

describe("isAbilityTestEdit", () => {
  it.each([
    { kind: "roll", base: 4 },
    { kind: "roll", base: null },
    { kind: "cancel" },
    { kind: "setDifficulty", base: 3 },
    { kind: "setDifficulty", base: null },
  ])("accepts %j", (edit) => {
    expect(isAbilityTestEdit(edit)).toBe(true);
  });

  it.each([
    null,
    [],
    "cancel",
    { kind: "roll" },
    { kind: "roll", base: 2.5 },
    { kind: "roll", base: "4" },
    { kind: "cancel", base: 4 },
    { kind: "explode" },
  ])("rejects %j", (edit) => {
    expect(isAbilityTestEdit(edit)).toBe(false);
  });
});

describe("canMakeAbilityTestEdit", () => {
  it("lets the GM do anything", () => {
    for (const edit of [
      { kind: "roll", base: 4 },
      { kind: "cancel" },
      { kind: "setDifficulty", base: 2 },
    ] as const) {
      expect(
        canMakeAbilityTestEdit({ edit, isGM: true, isRequester: false }),
      ).toBe(true);
    }
  });

  it("lets the requester cancel, or roll without a Difficulty", () => {
    expect(
      canMakeAbilityTestEdit({
        edit: { kind: "cancel" },
        isGM: false,
        isRequester: true,
      }),
    ).toBe(true);
    expect(
      canMakeAbilityTestEdit({
        edit: { kind: "roll", base: null },
        isGM: false,
        isRequester: true,
      }),
    ).toBe(true);
  });

  it("leaves setting the Difficulty to the GM", () => {
    for (const edit of [
      { kind: "roll", base: 4 },
      { kind: "setDifficulty", base: 2 },
    ] as const) {
      expect(
        canMakeAbilityTestEdit({ edit, isGM: false, isRequester: true }),
      ).toBe(false);
    }
  });

  it("doesn't let anyone else touch it", () => {
    expect(
      canMakeAbilityTestEdit({
        edit: { kind: "cancel" },
        isGM: false,
        isRequester: false,
      }),
    ).toBe(false);
  });
});
