import { produce } from "immer";
import { useEffect, useState } from "react";

import { systemLogger } from "../../../functions/utilities";
import { InvestigatorCombatant } from "../../../module/combat/InvestigatorCombatant";

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
    return data;
  });
  const [resource, setResource] = useState(() => getValue(combatant.resource));
  useEffect(() => {
    const handleUpdateCombatant = (
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
        });
        return newData;
      });
      setResource(getValue(updatedCombatant.resource));
    };
    Hooks.on("updateCombatant", handleUpdateCombatant);
    return () => {
      Hooks.off("updateCombatant", handleUpdateCombatant);
    };
  }, [combatant]);

  // ///////////////////////////////////////////////////////////////////////////
  // actor data
  const [actorData, setActorData] = useState(
    () => combatant.actor?.toJSON() ?? null,
  );
  useEffect(() => {
    if (combatant.actor === null) return;
    const handleUpdateActor = (
      updatedActor: Actor.Implementation,
      updates: Actor.UpdateData,
      options: Actor.Database.UpdateOptions,
      userId: string,
    ) => {
      if (updatedActor.id !== combatant.actor?.id) return;
      setActorData((previousActorData) => {
        if (previousActorData === null) return null;
        const newData = produce(previousActorData, (draft) => {
          foundry.utils.mergeObject(draft, updates);
        });
        return newData;
      });
    };
    Hooks.on("updateActor", handleUpdateActor);
    return () => {
      Hooks.off("updateActor", handleUpdateActor);
    };
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

  return { combatantData, actorData, effects, resource };
}
