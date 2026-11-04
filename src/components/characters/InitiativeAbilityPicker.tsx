import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { NPCActor } from "../../module/actors/npc";
import type { PCActor } from "../../module/actors/pc";
import { getGeneralAbilityNamesIn } from "../../module/items/findGeneralAbility";
import { OtherableDropDown } from "../inputs/OtherableDropDown";
import { Translate } from "../Translate";

export function InitiativeAbilityPicker({
  actor,
}: {
  actor: PCActor | NPCActor;
}) {
  const { initiativeAbility, generalAbilityNames } = useActorSnapshot(
    actor,
    (s) => ({
      initiativeAbility: s.system.initiativeAbility,
      generalAbilityNames: getGeneralAbilityNamesIn(s.items),
    }),
  );
  const combatAbilities = useSettings((s) => s.combatAbilities.toSorted());
  const { setInitiativeAbility } = useSystemMethods(actor);
  return (
    <div>
      <h3 css={{ gridColumn: "start / end" }}>
        <Translate>Initiative</Translate>
      </h3>
      <OtherableDropDown
        value={initiativeAbility}
        onChange={setInitiativeAbility}
        pickerValues={combatAbilities}
        validValues={generalAbilityNames}
      />
    </div>
  );
}
