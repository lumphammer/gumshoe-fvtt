import { expect, it, vi } from "vitest";

import {
  createSerializedPassingTurnUpdater,
  getPassingTurnsRemaining,
  updatePassingTurnInfo,
} from "./passingTurnState";

it("derives an absent round from the configured default", () => {
  expect(getPassingTurnsRemaining([], 2, 3)).toBe(3);
});

it("preserves a stored zero instead of applying the default", () => {
  expect(getPassingTurnsRemaining([{ turnsRemaining: 0 }], 0, 3)).toBe(0);
});

it("adds to the default when the round has not been stored yet", () => {
  const current = getPassingTurnsRemaining([], 0, 2);

  expect(updatePassingTurnInfo([], 0, current + 1)).toEqual([
    { turnsRemaining: 3 },
  ]);
});

it("removes from the default when the round has not been stored yet", () => {
  const current = getPassingTurnsRemaining([], 0, 2);

  expect(updatePassingTurnInfo([], 0, Math.max(0, current - 1))).toEqual([
    { turnsRemaining: 1 },
  ]);
});

it("updates one round without mutating the existing state", () => {
  const original = [{ turnsRemaining: 1 }, { turnsRemaining: 2 }];

  const updated = updatePassingTurnInfo(original, 1, 4);

  expect(updated).toEqual([{ turnsRemaining: 1 }, { turnsRemaining: 4 }]);
  expect(original).toEqual([{ turnsRemaining: 1 }, { turnsRemaining: 2 }]);
});

it("serializes updates for the same combatant", async () => {
  const serialize = createSerializedPassingTurnUpdater<object>();
  const combatant = {};
  const order: string[] = [];
  let releaseFirst: () => void = vi.fn();
  const firstCanFinish = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });

  const first = serialize(combatant, async () => {
    order.push("first started");
    await firstCanFinish;
    order.push("first finished");
  });
  const second = serialize(combatant, () => {
    order.push("second started");
    return Promise.resolve();
  });

  await Promise.resolve();
  expect(order).toEqual(["first started"]);
  releaseFirst();
  await Promise.all([first, second]);
  expect(order).toEqual(["first started", "first finished", "second started"]);
});

it("allows updates for different combatants to run concurrently", async () => {
  const serialize = createSerializedPassingTurnUpdater<object>();
  const started: string[] = [];

  const updates = ["one", "two"].map((name) =>
    serialize({}, () => {
      started.push(name);
      return Promise.resolve();
    }),
  );

  await Promise.all(updates);
  expect(started).toEqual(["one", "two"]);
});

it("continues the queue after a failed update", async () => {
  const serialize = createSerializedPassingTurnUpdater<object>();
  const combatant = {};
  const laterUpdate = vi.fn();

  await expect(
    serialize(combatant, () => Promise.reject(new Error("update failed"))),
  ).rejects.toThrow("update failed");
  await serialize(combatant, () => {
    laterUpdate();
    return Promise.resolve();
  });

  expect(laterUpdate).toHaveBeenCalledOnce();
});
