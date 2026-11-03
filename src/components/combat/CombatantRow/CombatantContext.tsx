import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

import { useActorSnapshot } from "../../../hooks/useActorSnapshot";
import { useCombatSnapshot } from "../../../hooks/useCombatSnapshot";
import { useSnapshot } from "../../../hooks/useSnapshot";
import type { CombatantEffectView } from "../../../module/actors/isCombatantEffectShown";
import { getCombatantEffectsOf } from "../../../module/actors/isCombatantEffectShown";
import {
  combatantData,
  getCombatantResourceStore,
} from "../../../module/snapshots/documentStores";
import type { CombatantSnapshot } from "../../../module/snapshots/snapshotTypes";
import type { ClassicCombatant } from "../../../module/combat/classicCombatant";
import { isClassicCombatant } from "../../../module/combat/classicCombatant";
import type { InvestigatorCombatant } from "../../../module/combat/InvestigatorCombatant";
import type { TurnPassingCombatant } from "../../../module/combat/turnPassingCombatant";
import { isTurnPassingCombatant } from "../../../module/combat/turnPassingCombatant";

type CombatantContextValue<
  TCombatant extends Combatant.Implementation = Combatant.Implementation,
> = {
  /** the combatant's data, from its combat's snapshot */
  combatantState: CombatantSnapshot;
  /** the live combatant, to write to */
  combatant: TCombatant;
  effects: readonly CombatantEffectView[];
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

/**
 * A combatant's row's data: the combatant from its combat's snapshot, the
 * effects to show from its actor's, and its resource.
 */
export function useCombatantContextValue(
  combatant: InvestigatorCombatant,
): CombatantContextValue {
  const id = combatant.id;
  const fromCombat = useCombatSnapshot(
    combatant.combat,
    (combat) => combat?.combatants.find((c) => c._id === id) ?? null,
  );
  // (only while it's being removed, before the row goes)
  const combatantState = fromCombat ?? combatantData(combatant);
  const effects = useActorSnapshot(combatant.actor, () =>
    getCombatantEffectsOf(combatant.actor),
  );
  const resource = useSnapshot(getCombatantResourceStore(combatant));

  return useMemo(
    () => ({ combatant, combatantState, effects, resource }),
    [combatant, combatantState, effects, resource],
  );
}
