import { createContext, ReactNode, useContext } from "react";

import { InvestigatorCombatant } from "../../../module/combat/InvestigatorCombatant";

type CombatantContextType = {
  combatant: InvestigatorCombatant;
  combatantData: SchemaField.SourceData<Combatant.Schema>;
};

const CombatantContext = createContext<CombatantContextType | undefined>(
  undefined,
);

export const useCombatantContext = () => {
  const context = useContext(CombatantContext);
  if (!context) {
    throw new Error(
      "useCombatantContext must be used within a CombatantProvider",
    );
  }
  return context;
};

export function CombatantContextProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: CombatantContextType;
}) {
  return (
    <CombatantContext.Provider value={value}>
      {children}
    </CombatantContext.Provider>
  );
}
