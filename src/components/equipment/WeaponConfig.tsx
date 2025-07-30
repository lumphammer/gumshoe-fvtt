import { useCallback } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { assertGame } from "../../functions/isGame";
import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertActiveCharacterActor } from "../../module/actors/types";
import { assertWeaponItem } from "../../module/items/weapon";
import { settings } from "../../settings/settings";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { OtherableDropDown } from "../inputs/OtherableDropDown";
import { TextInput } from "../inputs/TextInput";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";
import { WeaponRange } from "./WeaponRangeConfig";

export const WeaponConfig = () => {
  assertGame(game);
  const { item } = useItemSheetContext();
  const actor = item.actor;
  // neat, ts is smort enough to narrow to `ActiveCharacterActor | null` here
  if (actor) {
    assertActiveCharacterActor(actor);
  }
  const generalAbilityNames = actor?.system.getGeneralAbilityNames();

  assertWeaponItem(item);
  const name = useAsyncUpdate(item.name || "", item.setName);

  const onClickDelete = useCallback(async () => {
    assertGame(game);
    const message = item.actor
      ? "DeleteActorNamesEquipmentName"
      : "DeleteEquipmentName";

    const aye = await confirmADoodleDo({
      message,
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmIconClass: "fa-trash",
      values: {
        ActorName: item.actor?.name ?? "",
        EquipmentName: item.name ?? "",
      },
      resolveFalseOnCancel: true,
    });
    if (aye) {
      await item.delete();
    }
  }, [item]);

  const validCombatAbilities = settings.combatAbilities.get();

  return (
    <InputGrid>
      <GridField label="Item Name">
        <TextInput value={name.display} onChange={name.onChange} />
      </GridField>
      <GridField label="Cost">
        <AsyncNumberInput
          min={0}
          value={item.system.cost}
          onChange={item.system.setCost}
        />
      </GridField>

      <GridField label="Initiative">
        <OtherableDropDown
          value={item.system.ability}
          onChange={item.system.setAbility}
          pickerValues={validCombatAbilities}
          validValues={generalAbilityNames}
          css={{ marginBottom: "0.3em" }}
        />
      </GridField>
      <GridField label="Base Damage">
        <AsyncNumberInput
          value={item.system.damage}
          onChange={item.system.setDamage}
        />
      </GridField>
      <WeaponRange
        label="Point Blank"
        damage={item.system.pointBlankDamage ?? 0}
        enabled={item.system.isPointBlank}
        setDamage={item.system.setPointBlankDamage}
        setEnabled={item.system.setIsPointBlank}
      />
      <WeaponRange
        label="Close range"
        damage={item.system.closeRangeDamage ?? 0}
        enabled={item.system.isCloseRange}
        setDamage={item.system.setCloseRangeDamage}
        setEnabled={item.system.setIsCloseRange}
      />
      <WeaponRange
        label="Near range"
        damage={item.system.nearRangeDamage ?? 0}
        enabled={item.system.isNearRange}
        setDamage={item.system.setNearRangeDamage}
        setEnabled={item.system.setIsNearRange}
      />
      <WeaponRange
        label="Long range"
        damage={item.system.longRangeDamage ?? 0}
        enabled={item.system.isLongRange}
        setDamage={item.system.setLongRangeDamage}
        setEnabled={item.system.setIsLongRange}
      />
      <GridField label="Uses ammo?">
        <Toggle
          checked={item.system.usesAmmo}
          onChange={item.system.setUsesAmmo}
        />
      </GridField>
      {item.system.usesAmmo && (
        <>
          <GridField label="Ammo capacity">
            <AsyncNumberInput
              min={0}
              value={item.system.ammo.max}
              onChange={item.system.setAmmoMax}
            />
          </GridField>
          <GridField label="Ammo per attack">
            <AsyncNumberInput
              min={0}
              value={item.system.ammoPerShot}
              onChange={item.system.setAmmoPerShot}
            />
          </GridField>
        </>
      )}
      <GridField label="Delete">
        <Button onClick={onClickDelete}>
          <Translate>Delete</Translate>
        </Button>
      </GridField>
    </InputGrid>
  );
};
