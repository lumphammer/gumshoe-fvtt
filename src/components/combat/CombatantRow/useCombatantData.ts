import { produce } from "immer";
import { useEffect, useState } from "react";

import { systemLogger } from "../../../functions/utilities";
import { InvestigatorCombatant } from "../../../module/combat/InvestigatorCombatant";
import { registerHookHandler } from "../registerHookHandler";

const getValue = <T>(resource: T): T | number => {
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

export function useCombatantData(combatant: InvestigatorCombatant) {
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
      systemLogger.log("Combatant effects updated", effects);
      setEffects(effects);
    });
  }, [combatant]);

  return { combatantData, effects, resource };
}
