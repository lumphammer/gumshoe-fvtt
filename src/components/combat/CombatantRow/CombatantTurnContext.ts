import { createContext, useContext } from "react";

import type { InvestigatorCombatant } from "../../../module/combat/InvestigatorCombatant";
import { isTurnPassingCombatant } from "../../../module/combat/turnPassingCombatant";

/**
 * Whether it's this combatant's turn, for one combatant's row. The tracker's
 * own context changes on every combat update; this changes only for the rows
 * whose turn started or ended.
 */
export const CombatantActiveContext = createContext(false);

/**
 * The combat's round. A turn-passing combatant's turns remaining depend on
 * it (read from the live combatant, by `usePassingTurns`), so what shows them
 * re-renders when it changes, without re-rendering whole rows.
 */
export const CombatRoundContext = createContext(0);

/** Whether it's this combatant's turn, and the combat's round */
export const useCombatantTurn = () => ({
  active: useContext(CombatantActiveContext),
  round: useContext(CombatRoundContext),
});

/**
 * A turn-passing combatant's turns remaining this round, and how many it
 * starts each round with (`null` for other combatants). Read from the live
 * combatant, re-rendering when the round changes; the row's own state brings
 * in changes to the combatant.
 *
 * Not compiled by React Compiler (hooks aren't marked), so it reads them again
 * on every render: the compiled components which call it would otherwise
 * cache them on the combatant, which is the same object when they change.
 */
export const usePassingTurns = (combatant: InvestigatorCombatant) => {
  useContext(CombatRoundContext);
  return isTurnPassingCombatant(combatant)
    ? {
        remaining: combatant.system.passingTurnsRemaining,
        total: combatant.system.defaultPassingTurns,
      }
    : null;
};
