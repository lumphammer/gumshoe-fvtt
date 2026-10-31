import { memo, useCallback } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { assertGame } from "../../functions/isGame";
import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import type { ItemSnapshot } from "../../hooks/useItemSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { getGeneralAbilityNamesIn } from "../../module/items/findGeneralAbility";
import type { WeaponItem, WeaponSystemData } from "../../module/items/weapon";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { OtherableDropDown } from "../inputs/OtherableDropDown";
import { Select } from "../inputs/Select";
import { TextInput } from "../inputs/TextInput";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";
import { WeaponLethalityField } from "./WeaponLethalityField";
import { WeaponRange, WeaponRangeHeadings } from "./WeaponRangeConfig";
import { getTranslated } from "../../functions/getTranslated";
import type { WeaponFireModes } from "../../module/attacks/rules";
import { weaponFireModesValues } from "../../module/attacks/rules";

const weaponFireModesText: Record<WeaponFireModes, string> = {
  single: "WeaponFireModesSingle",
  selective: "WeaponFireModesSelective",
  alwaysAuto: "WeaponFireModesAlwaysAuto",
};

interface WeaponConfigProps {
  /** Only to write through: read from `weapon`. */
  item: WeaponItem;
  weapon: ItemSnapshot<WeaponSystemData>;
}

export const WeaponConfig = memo(function WeaponConfig({
  item,
  weapon,
}: WeaponConfigProps) {
  const system = weapon.system;
  const methods = useSystemMethods(item);
  const generalAbilityNames = useActorSnapshot(item.actor, (actor) =>
    actor ? getGeneralAbilityNamesIn(actor.items) : undefined,
  );
  const settings = useSettings((s) => ({
    combatAbilities: s.combatAbilities,
    useDamageApplication: s.useDamageApplication,
    useGunfireOnHumans: s.useGunfireOnHumans,
    useLethalityAndAutofire: s.useLethalityAndAutofire,
    useExtendedRange: s.useExtendedRange,
  }));
  const name = useAsyncUpdate(weapon.name, item.setName);

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

  const validCombatAbilities = settings.combatAbilities;
  const useDamageApplication = settings.useDamageApplication;
  const showGunfire = useDamageApplication && settings.useGunfireOnHumans;
  const showLethality =
    useDamageApplication && settings.useLethalityAndAutofire;
  const showFireModes =
    useDamageApplication && settings.useLethalityAndAutofire;
  const fireModes = system.fireModes;
  const useExtendedRange = settings.useExtendedRange;

  return (
    <InputGrid>
      <GridField label="Item Name">
        <TextInput value={name.display} onChange={name.onChange} />
      </GridField>
      <GridField label="Cost">
        <AsyncNumberInput
          min={0}
          value={system.cost}
          onChange={methods.setCost}
        />
      </GridField>

      <GridField label="Initiative">
        <OtherableDropDown
          value={system.ability}
          onChange={methods.setAbility}
          pickerValues={validCombatAbilities}
          validValues={generalAbilityNames}
          css={{ marginBottom: "0.3em" }}
        />
      </GridField>
      <GridField label="Base Damage">
        <AsyncNumberInput value={system.damage} onChange={methods.setDamage} />
      </GridField>
      {showFireModes && (
        <GridField label="Fire modes">
          <Select
            value={fireModes}
            onChange={(e) => {
              void methods.setFireModes(
                e.currentTarget.value as WeaponFireModes,
              );
            }}
            css={{ width: "100%" }}
          >
            {weaponFireModesValues.map((value) => (
              <option key={value} value={value}>
                {getTranslated(weaponFireModesText[value])}
              </option>
            ))}
          </Select>
        </GridField>
      )}
      {showLethality && (
        <WeaponLethalityField
          lethality={system.lethality}
          setLethality={methods.setLethality}
        />
      )}
      {showGunfire && (
        <GridField label="Gunfire?">
          <Toggle checked={system.isGunfire} onChange={methods.setIsGunfire} />
        </GridField>
      )}
      {useExtendedRange && <WeaponRangeHeadings />}
      <WeaponRange
        label="Point Blank"
        damage={system.pointBlankDamage ?? 0}
        enabled={system.isPointBlank}
        setDamage={methods.setPointBlankDamage}
        setEnabled={methods.setIsPointBlank}
        {...(useExtendedRange && {
          spend: system.pointBlankSpend,
          setSpend: methods.setPointBlankSpend,
        })}
      />
      <WeaponRange
        label="Close range"
        damage={system.closeRangeDamage ?? 0}
        enabled={system.isCloseRange}
        setDamage={methods.setCloseRangeDamage}
        setEnabled={methods.setIsCloseRange}
        {...(useExtendedRange && {
          spend: system.closeRangeSpend,
          setSpend: methods.setCloseRangeSpend,
        })}
      />
      <WeaponRange
        label="Near range"
        damage={system.nearRangeDamage ?? 0}
        enabled={system.isNearRange}
        setDamage={methods.setNearRangeDamage}
        setEnabled={methods.setIsNearRange}
        {...(useExtendedRange && {
          spend: system.nearRangeSpend,
          setSpend: methods.setNearRangeSpend,
        })}
      />
      <WeaponRange
        label="Long range"
        damage={system.longRangeDamage ?? 0}
        enabled={system.isLongRange}
        setDamage={methods.setLongRangeDamage}
        setEnabled={methods.setIsLongRange}
        {...(useExtendedRange && {
          spend: system.longRangeSpend,
          setSpend: methods.setLongRangeSpend,
        })}
      />
      {useExtendedRange && (
        <WeaponRange
          label="Extended range"
          damage={system.extendedRangeDamage}
          enabled={system.isExtendedRange}
          setDamage={methods.setExtendedRangeDamage}
          setEnabled={methods.setIsExtendedRange}
          spend={system.extendedRangeSpend}
          setSpend={methods.setExtendedRangeSpend}
        />
      )}
      <GridField label="Uses ammo?">
        <Toggle checked={system.usesAmmo} onChange={methods.setUsesAmmo} />
      </GridField>
      {system.usesAmmo && (
        <>
          <GridField label="Ammo capacity">
            <AsyncNumberInput
              min={0}
              value={system.ammo.max}
              onChange={methods.setAmmoMax}
            />
          </GridField>
          <GridField label="Ammo per attack">
            <AsyncNumberInput
              min={0}
              value={system.ammoPerShot}
              onChange={methods.setAmmoPerShot}
            />
          </GridField>
          {showFireModes && fireModes === "selective" && (
            <GridField label="Ammo per burst">
              <AsyncNumberInput
                min={1}
                integer
                value={system.ammoPerBurst}
                onChange={methods.setAmmoPerBurst}
              />
            </GridField>
          )}
          {showFireModes && fireModes !== "single" && (
            <GridField label="Ammo per full-auto">
              <AsyncNumberInput
                min={0}
                value={system.ammoPerFullAuto}
                onChange={methods.setAmmoPerFullAuto}
              />
            </GridField>
          )}
        </>
      )}
      <GridField label="Delete">
        <Button onClick={onClickDelete}>
          <Translate>Delete</Translate>
        </Button>
      </GridField>
    </InputGrid>
  );
});
