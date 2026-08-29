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
