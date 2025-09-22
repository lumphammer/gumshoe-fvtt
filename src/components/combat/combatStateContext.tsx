import { createContext, useContext } from "react";

import { SourceData } from "../../fvtt-exports";

export type CombatantState = SourceData<Combatant.Schema>;

export type CombatState = SourceData<Combat.Schema>;

type _T = CombatState["system"];

export type CombatStateContextType = {
  combat: CombatState | null;
  turns: CombatantState[];
  isActiveUser: boolean;
};

const combatStateContext = createContext<CombatStateContextType>({
  combat: null,
  turns: [],
  isActiveUser: false,
});

export const useCombatState = () => {
  return useContext(combatStateContext);
};

export const CombatStateProvider = combatStateContext.Provider;
