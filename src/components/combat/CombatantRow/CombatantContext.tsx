import { produce } from "immer";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { SourceData } from "../../../fvtt-exports";
import {
  ClassicCombatant,
  isClassicCombatant,
} from "../../../module/combat/classicCombatant";
import { InvestigatorCombatant } from "../../../module/combat/InvestigatorCombatant";
import {
  isTurnPassingCombatant,
  TurnPassingCombatant,
} from "../../../module/combat/turnPassingCombatant";
import { registerHookHandler } from "../registerHookHandler";

type CombatantContextValue<
  TCombatant extends Combatant.Implementation = Combatant.Implementation,
> = {
  combatantState: SourceData<Combatant.Schema>;
  combatant: TCombatant;
  effects: SchemaField.SourceData<ActiveEffect.Schema>[];
  resource: number;
};

const CombatantContext = createContext<CombatantContextValue | null>(null);

export const useCombatantContext = () => {
  const context = useContext(CombatantContext);
  if (!context) {
    throw new Error(
      "useCombatantContext must be used within a CombatantProvider",
    );
  }
  return context;
};

export function useClassicCombatantContext(): CombatantContextValue<ClassicCombatant> {
  const context = useContext(CombatantContext);
  if (isClassicCombatant(context?.combatant)) {
    return context as CombatantContextValue<ClassicCombatant>;
  } else {
    throw new Error("useClassicCombatantContext used with non-classic combat");
  }
}

export function useTurnPassingCombatantContext(): CombatantContextValue<TurnPassingCombatant> {
  const context = useContext(CombatantContext);
  if (isTurnPassingCombatant(context?.combatant)) {
    return context as CombatantContextValue<TurnPassingCombatant>;
  } else {
    throw new Error(
      "useTurnPassingCombatantContext used with non-turn-passing combat",
    );
  }
}

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
  const [combatantState, setCombatantState] = useState(() => {
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
        setCombatantState((previousCombatantData) => {
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

  useEffect(() => {
    return combatant.registerResourceHandler((resource) => {
      setResource(getValue(resource));
    });
  }, [combatant]);

  return useMemo(
    () => ({ combatant, combatantState, effects, resource }),
    [combatant, combatantState, effects, resource],
  );
}
