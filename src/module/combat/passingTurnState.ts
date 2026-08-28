export type PassingTurnInfo = ReadonlyArray<
  { turnsRemaining: number } | null | undefined
>;

export function getPassingTurnsRemaining(
  turnInfo: PassingTurnInfo,
  roundIndex: number,
  defaultPassingTurns: number,
): number {
  return turnInfo[roundIndex]?.turnsRemaining ?? defaultPassingTurns;
}

export function updatePassingTurnInfo(
  turnInfo: PassingTurnInfo,
  roundIndex: number,
  turnsRemaining: number,
): Array<{ turnsRemaining: number } | null | undefined> {
  const updated = [...turnInfo];
  updated[roundIndex] = {
    ...(updated[roundIndex] ?? {}),
    turnsRemaining,
  };
  return updated;
}

export function createSerializedPassingTurnUpdater<Key extends object>() {
  const pendingUpdates = new WeakMap<Key, Promise<void>>();

  return (key: Key, update: () => Promise<void>): Promise<void> => {
    const previousUpdate = pendingUpdates.get(key) ?? Promise.resolve();
    const currentUpdate = previousUpdate.then(update);
    pendingUpdates.set(
      key,
      currentUpdate.catch(() => {
        // Keep a failed update from preventing later updates from running.
      }),
    );
    return currentUpdate;
  };
}
