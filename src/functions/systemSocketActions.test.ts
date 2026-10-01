import { expect, it, vi } from "vitest";

import { isSystemSocketAction } from "../typeAssertions";
import { canUserRequestCombatAction } from "./canUserRequestCombatAction";
import { dispatchSystemSocketAction } from "./systemSocketActions";

it.each([
  null,
  {},
  { hook: "updateActor", payload: [] },
  { type: "updateActor" },
  { type: "requestNextTurn", payload: [] },
  { type: "requestTurnPass" },
  { type: "requestTurnPass", combatantId: "" },
  { type: "requestTurnPass", combatantId: 42 },
  { type: "requestTurnPass", combatantId: "abc", extra: true },
  { type: "applyAttackDamage", messageId: "m", targetId: "t" },
  { type: "applyAttackDamage", messageId: "", targetId: "t", undo: false },
  { type: "applyAttackDamage", messageId: "m", targetId: "", undo: false },
  { type: "applyAttackDamage", messageId: "m", targetId: "t", undo: "no" },
  {
    type: "applyAttackDamage",
    messageId: "m",
    targetId: "t",
    undo: false,
    damage: 99,
  },
])("rejects an invalid system socket action: %j", (action) => {
  expect(isSystemSocketAction(action)).toBe(false);
});

it.each([
  { type: "requestNextTurn" },
  { type: "requestTurnPass", combatantId: "abc" },
  { type: "applyAttackDamage", messageId: "m", targetId: "t", undo: true },
])("accepts the system socket action: %j", (action) => {
  expect(isSystemSocketAction(action)).toBe(true);
});

it("dispatches only the requested command with the authenticated user ID", () => {
  const handlers = {
    requestNextTurn: vi.fn(),
    requestTurnPass: vi.fn(),
    applyAttackDamage: vi.fn(),
  };

  dispatchSystemSocketAction(
    { type: "requestTurnPass", combatantId: "combatant-id" },
    "user-id",
    handlers,
  );

  expect(handlers.requestTurnPass).toHaveBeenCalledWith(
    { combatantId: "combatant-id" },
    "user-id",
  );
  expect(handlers.requestNextTurn).not.toHaveBeenCalled();
});

it("dispatches an attack damage request without extra properties", () => {
  const handlers = {
    requestNextTurn: vi.fn(),
    requestTurnPass: vi.fn(),
    applyAttackDamage: vi.fn(),
  };

  dispatchSystemSocketAction(
    {
      type: "applyAttackDamage",
      messageId: "message-id",
      targetId: "target-id",
      undo: false,
    },
    "user-id",
    handlers,
  );

  expect(handlers.applyAttackDamage).toHaveBeenCalledWith(
    { messageId: "message-id", targetId: "target-id", undo: false },
    "user-id",
  );
  expect(handlers.requestTurnPass).not.toHaveBeenCalled();
});

it("allows a GM to request a combat action", () => {
  expect(canUserRequestCombatAction({ id: "gm", isGM: true }, undefined)).toBe(
    true,
  );
});

it("allows a player to act for a combatant they control", () => {
  expect(
    canUserRequestCombatAction(
      { id: "owner", isGM: false },
      { players: [{ id: "owner" }] },
    ),
  ).toBe(true);
});

it("rejects a player who does not control the combatant", () => {
  expect(
    canUserRequestCombatAction(
      { id: "attacker", isGM: false },
      { players: [{ id: "owner" }] },
    ),
  ).toBe(false);
});

it("rejects an unknown combatant for a player", () => {
  expect(canUserRequestCombatAction({ id: "player", isGM: false }, null)).toBe(
    false,
  );
});
