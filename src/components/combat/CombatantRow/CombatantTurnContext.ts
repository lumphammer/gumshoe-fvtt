import { createContext, useContext } from "react";

import type { InvestigatorCombatant } from "../../../module/combat/InvestigatorCombatant";
import { useActorSnapshot } from "../../../hooks/useActorSnapshot";
import { useCombatSnapshot } from "../../../hooks/useCombatSnapshot";
import { getPassingTurnsRemaining } from "../../../module/combat/passingTurnState";

/**
 * Whether it's this combatant's turn, for one combatant's row. The tracker's
 * own context changes on every combat update; this changes only for the rows
 * whose turn started or ended.
 */
export const CombatantActiveContext = createContext(false);

/**
 * The combat's round. A turn-passing combatant's turns remaining depend on
 * it (selected by `usePassingTurns`), so what shows them
 * re-renders when it changes, without re-rendering whole rows.
 */
export const CombatRoundContext = createContext(0);

/** Whether it's this combatant's turn, and the combat's round */
export const useCombatantTurn = () => ({
  active: useContext(CombatantActiveContext),
  round: useContext(CombatRoundContext),
});

/** Turns follow the combatant's recorded state, its actor's default and the round. */
export const usePassingTurns = (combatant: InvestigatorCombatant) => {
  const round = useContext(CombatRoundContext);
  const turnInfo = useCombatSnapshot(combatant.combat, (combat) => {
    const state = combat?.combatants.find((c) => c._id === combatant.id);
    return state?.type === "turnPassing" ? state.system.turnInfo : null;
  });
  const total = useActorSnapshot(combatant.actor, (actor) =>
    actor?.type === "pc" || actor?.type === "npc"
      ? (actor.system.initiativePassingTurns ?? 1)
      : 1,
  );
  return turnInfo === null
    ? null
    : {
        remaining: getPassingTurnsRemaining(
          turnInfo,
          Math.max(0, round - 1),
          total,
        ),
        total,
      };
};
