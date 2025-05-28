import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertActiveCharacterActor } from "../../module/actors/exports";
import { settings } from "../../settings/settings";
import { OtherableDropDown } from "../inputs/OtherableDropDown";
import { Translate } from "../Translate";

export const CharacterCombatAbilityPicker = () => {
  const { actor } = useActorSheetContext();
  assertActiveCharacterActor(actor);
  return (
    <>
      <h3 css={{ gridColumn: "start / end" }}>
        <Translate>Initiative</Translate>
      </h3>
      <OtherableDropDown
        value={actor.system.initiativeAbility}
        onChange={actor.system.setInitiativeAbility}
        pickerValues={settings.combatAbilities.get().toSorted()}
        validValues={actor.system.getGeneralAbilityNames()}
      />
    </>
  );
};

CharacterCombatAbilityPicker.displayName = "CharacterCombatAbilityPicker";
