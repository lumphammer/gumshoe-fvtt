import type { TurnInfo } from "./classicCombat";

export function findUndefeatedTurnIndex(
  turns: readonly TurnInfo[],
  startIndex: number,
  direction: -1 | 1,
  isDefeated: (combatantId: string) => boolean,
): number {
  let index = startIndex;
  while (
    index >= 0 &&
    index < turns.length &&
    isDefeated(turns[index].combatantId)
  ) {
    index += direction;
  }
  return index;
}
