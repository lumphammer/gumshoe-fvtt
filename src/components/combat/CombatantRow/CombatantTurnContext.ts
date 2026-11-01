import { createContext, useContext } from "react";

/**
 * Whether it's this combatant's turn, for one combatant's row. The tracker's
 * own context changes on every combat update; this changes only for the rows
 * whose turn started or ended.
 */
export const CombatantActiveContext = createContext(false);

/**
 * The combat's round. A turn-passing combatant's turns remaining depend on
 * it (read from the live combatant), so what shows them re-renders when it
 * changes, without re-rendering whole rows.
 */
export const CombatRoundContext = createContext(0);

/** Whether it's this combatant's turn, and the combat's round */
export const useCombatantTurn = () => ({
  active: useContext(CombatantActiveContext),
  round: useContext(CombatRoundContext),
});
