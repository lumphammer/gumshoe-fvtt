import { expect, it } from "vitest";

import { findUndefeatedTurnIndex } from "./findUndefeatedTurnIndex";

const turns = [
  { combatantId: "third-in-collection" },
  { combatantId: "first-in-collection" },
  { combatantId: "second-in-collection" },
];
const defeated = new Set(["first-in-collection"]);
const isDefeated = (combatantId: string) => defeated.has(combatantId);

it("skips defeated combatants forwards using round turn order", () => {
  expect(findUndefeatedTurnIndex(turns, 1, 1, isDefeated)).toBe(2);
});

it("skips defeated combatants backwards using round turn order", () => {
  expect(findUndefeatedTurnIndex(turns, 1, -1, isDefeated)).toBe(0);
});

it("returns the round end when no later combatant is available", () => {
  expect(findUndefeatedTurnIndex([turns[1]], 0, 1, isDefeated)).toBe(1);
});

it("returns before the round start when no earlier combatant is available", () => {
  expect(findUndefeatedTurnIndex([turns[1]], 0, -1, isDefeated)).toBe(-1);
});
