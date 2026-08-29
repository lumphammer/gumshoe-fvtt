import type { TurnInfo } from "./classicCombat";

type ReconciledTurns = {
  turns: TurnInfo[];
  turnIndex: number | null;
};

export function removeCombatantTurns(
  oldTurns: readonly TurnInfo[],
  oldTurnIndex: number | null,
  deletedIds: readonly string[],
): ReconciledTurns {
  const deleted = new Set(deletedIds);
  const turns = oldTurns.filter(({ combatantId }) => !deleted.has(combatantId));
  if (oldTurnIndex === null || turns.length === 0) {
    return { turns, turnIndex: null };
  }

  const oldActiveId = oldTurns[oldTurnIndex]?.combatantId;
  const nextActiveId =
    (oldActiveId !== undefined && !deleted.has(oldActiveId)
      ? oldActiveId
      : oldTurns
          .slice(oldTurnIndex + 1)
          .find(({ combatantId }) => !deleted.has(combatantId))?.combatantId) ??
    oldTurns
      .slice(0, oldTurnIndex)
      .findLast(({ combatantId }) => !deleted.has(combatantId))?.combatantId;

  const turnIndex = turns.findIndex(
    ({ combatantId }) => combatantId === nextActiveId,
  );
  return { turns, turnIndex: turnIndex === -1 ? null : turnIndex };
}
