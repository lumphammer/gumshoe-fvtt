import { describe, expect, it } from "vitest";

import { isCombatantEffectShown } from "./isCombatantEffectShown";

const constants = {
  defeatedStatusId: "dead",
  showIcon: { NEVER: 0, CONDITIONAL: 1, ALWAYS: 2 },
};

function effect(
  showIcon: number,
  isTemporary: boolean,
  statuses: string[] = [],
) {
  return { showIcon, isTemporary, statuses: new Set(statuses) };
}

describe("isCombatantEffectShown", () => {
  it("shows a status effect with no duration", () => {
    expect(isCombatantEffectShown(effect(2, false, ["deaf"]), constants)).toBe(
      true,
    );
  });

  it("shows a conditional effect only while it's temporary", () => {
    expect(isCombatantEffectShown(effect(1, true), constants)).toBe(true);
    expect(isCombatantEffectShown(effect(1, false), constants)).toBe(false);
  });

  it("never shows an effect set to never show", () => {
    expect(isCombatantEffectShown(effect(0, true), constants)).toBe(false);
  });

  it("leaves out the Dead status", () => {
    expect(isCombatantEffectShown(effect(2, false, ["dead"]), constants)).toBe(
      false,
    );
  });
});
