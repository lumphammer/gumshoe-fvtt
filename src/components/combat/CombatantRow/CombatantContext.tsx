import { produce } from "immer";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { InvestigatorCombatant } from "../../../module/combat/InvestigatorCombatant";
import { registerHookHandler } from "../registerHookHandler";

type CombatantContextValue = {
  combatant: InvestigatorCombatant;
  combatantData: SchemaField.SourceData<Combatant.Schema>;
  effects: SchemaField.SourceData<ActiveEffect.Schema>[];
  resource: number;
};

const CombatantContext = createContext<CombatantContextValue | undefined>(
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
  value: CombatantContextValue;
}) {
  return (
    <CombatantContext.Provider value={value}>
      {children}
    </CombatantContext.Provider>
  );
}

const getValue = <T,>(resource: T): number => {
  if (
    typeof resource === "object" &&
    resource !== null &&
    "value" in resource &&
    typeof resource.value === "number"
  ) {
    return resource.value;
  } else if (typeof resource === "number") {
    return resource;
  }
  return 0;
};

export function useCombatantContextValue(
  combatant: InvestigatorCombatant,
): CombatantContextValue {
  // ///////////////////////////////////////////////////////////////////////////
  // combatant data
  const [combatantData, setCombatantData] = useState(() => {
    const data = combatant.toJSON();
    data.img = combatant.img;
    data.name = combatant.name;
    return data;
  });
  const [resource, setResource] = useState(() => getValue(combatant.resource));
  useEffect(() => {
    return registerHookHandler(
      "updateCombatant",
      (
        updatedCombatant: InvestigatorCombatant,
        updates: Combatant.UpdateData,
        options: Combatant.Database.UpdateOptions,
        userId: string,
      ) => {
        if (updatedCombatant.id !== combatant.id) return;
        setCombatantData((previousCombatantData) => {
          const newData = produce(previousCombatantData, (draft) => {
            foundry.utils.mergeObject(draft, updates);
            draft.img = updatedCombatant.img;
            draft.name = updatedCombatant.name;
          });
          return newData;
        });
        setResource(getValue(updatedCombatant.resource));
      },
    );
  }, [combatant]);

  // effects data
  const [effects, setEffects] = useState<
    SchemaField.SourceData<ActiveEffect.Schema>[]
  >([]);
  useEffect(() => {
    return combatant.actor?.registerCombatantEffectsHandler((effects) => {
      setEffects(effects);
    });
  }, [combatant]);

  return useMemo(
    () => ({ combatant, combatantData, effects, resource }),
    [combatant, combatantData, effects, resource],
  );
}
