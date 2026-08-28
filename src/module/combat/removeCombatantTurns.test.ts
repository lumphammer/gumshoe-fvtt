import { expect, it } from "vitest";

import { removeCombatantTurns } from "./removeCombatantTurns";

const turns = ["A", "B", "C"].map((combatantId) => ({ combatantId }));

it("preserves the active combatant when an earlier turn is deleted", () => {
  expect(removeCombatantTurns(turns, 1, ["A"])).toEqual({
    turns: [{ combatantId: "B" }, { combatantId: "C" }],
    turnIndex: 0,
  });
});

it("selects the next survivor when the active combatant is deleted", () => {
  expect(removeCombatantTurns(turns, 1, ["B"])).toEqual({
    turns: [{ combatantId: "A" }, { combatantId: "C" }],
    turnIndex: 1,
  });
});

it("selects the previous survivor when the last combatant is deleted", () => {
  expect(removeCombatantTurns(turns, 2, ["C"])).toEqual({
    turns: [{ combatantId: "A" }, { combatantId: "B" }],
    turnIndex: 1,
  });
});

it("clears the active turn when every combatant is deleted", () => {
  expect(removeCombatantTurns(turns, 1, ["A", "B", "C"])).toEqual({
    turns: [],
    turnIndex: null,
  });
});
