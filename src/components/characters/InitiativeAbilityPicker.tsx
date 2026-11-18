import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { NPCActor } from "../../module/actors/npc";
import type { PCActor } from "../../module/actors/pc";
import { getGeneralAbilityNamesIn } from "../../module/items/findGeneralAbility";
import { OtherableDropDown } from "../inputs/OtherableDropDown";
import { Translate } from "../Translate";
import { css } from "../../styled-system/css";
import { inlineField, inlineLabel } from "./StatField";

export function InitiativeAbilityPicker({
  actor,
  inline = false,
}: {
  actor: PCActor | NPCActor;
  /** The label beside the picker, rather than above it */
  inline?: boolean;
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
    <div className={inline ? inlineField : undefined}>
      <h3 className={inline ? inlineLabel : css({ gridColumn: "start / end" })}>
        <Translate>Initiative</Translate>
      </h3>
      <OtherableDropDown
        className={inline ? css({ width: "12em" }) : undefined}
        value={initiativeAbility}
        onChange={setInitiativeAbility}
        pickerValues={combatAbilities}
        validValues={generalAbilityNames}
      />
    </div>
  );
}
