import { useCallback, useContext } from "react";

import { confirmADoodleDo } from "../../../functions/confirmADoodleDo";
import { assertGame } from "../../../functions/isGame";
import { WeaponItem } from "../../../module/items/weapon";
import { settings } from "../../../settings/settings";
import { ThemeContext } from "../../../themes/ThemeContext";
import { AsyncNumberInput } from "../../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { Button } from "../../inputs/Button";
import { CompactNotesEditor } from "../../inputs/CompactNotesEditor";
import { OtherableDropDown } from "../../inputs/OtherableDropDown";
import { Toggle } from "../../inputs/Toggle";

type WeaponRowEditProps = {
  weapon: WeaponItem;
  index: number;
};

export const WeaponRowEdit = ({ weapon, index }: WeaponRowEditProps) => {
  const theme = useContext(ThemeContext);

  const weaponRangeReduce = useCallback(async () => {
    if (weapon.system.isLongRange) {
      await weapon.system.setIsLongRange(false);
    } else if (weapon.system.isNearRange) {
      await weapon.system.setIsNearRange(false);
    } else if (weapon.system.isCloseRange) {
      await weapon.system.setIsCloseRange(false);
    }
  }, [weapon]);
  const weaponRangeExpand = useCallback(async () => {
    if (!weapon.system.isCloseRange) {
      await weapon.system.setIsCloseRange(true);
    } else if (!weapon.system.isNearRange) {
      await weapon.system.setIsNearRange(true);
    } else if (!weapon.system.isLongRange) {
      await weapon.system.setIsLongRange(true);
    }
  }, [weapon]);
  const onClickDelete = useCallback(async () => {
    assertGame(game);
    const message = weapon.actor
      ? "DeleteActorNamesEquipmentName"
      : "DeleteEquipmentName";

    const yes = await confirmADoodleDo({
      message,
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmIconClass: "fa-trash",
      values: {
        ActorName: weapon.actor?.name ?? "",
        EquipmentName: weapon.name ?? "",
      },
    });
    if (yes) {
      await weapon.delete();
    }
  }, [weapon]);

  const gridRow = index * 3 + 3;

  return (
    <>
      <div
        css={{
          gridColumn: "1/-1",
          gridRow: `${gridRow}/${gridRow + 2}`,
          background: theme.colors.backgroundButton,
          margin: "-0.5em",
        }}
      />
      <div
        css={{
          gridColumn: "1/-1",
          gridRow: `${gridRow + 2}/${gridRow + 3}`,
          height: "0.5em",
        }}
      />

      {/* NAME */}
      <AsyncTextInput
        css={{
          gridColumn: "name",
          gridRow,
        }}
        value={weapon.name ?? ""}
        onChange={weapon.setName}
      />
      <AsyncNumberInput
        value={weapon.system.damage}
        onChange={weapon.system.setDamage}
        noPlusMinus
        css={{ gridColumn: "base", gridRow }}
      />
      {weapon.system.isPointBlank && (
        <AsyncNumberInput
          value={weapon.system.pointBlankDamage}
          onChange={weapon.system.setPointBlankDamage}
          noPlusMinus
          css={{ gridColumn: "pb", gridRow }}
        />
      )}
      {weapon.system.isCloseRange && (
        <AsyncNumberInput
          value={weapon.system.closeRangeDamage}
          onChange={weapon.system.setCloseRangeDamage}
          noPlusMinus
          css={{ gridColumn: "cr", gridRow }}
        />
      )}
      {weapon.system.isNearRange && (
        <AsyncNumberInput
          value={weapon.system.nearRangeDamage}
          onChange={weapon.system.setNearRangeDamage}
          noPlusMinus
          css={{ gridColumn: "nr", gridRow }}
        />
      )}
      {weapon.system.isLongRange && (
        <AsyncNumberInput
          value={weapon.system.longRangeDamage}
          onChange={weapon.system.setLongRangeDamage}
          noPlusMinus
          css={{ gridColumn: "lr", gridRow }}
        />
      )}

      {/* left/right arrows */}
      <div
        css={{
          gridColumn: weapon.system.isLongRange
            ? "back"
            : weapon.system.isNearRange
              ? "lr"
              : weapon.system.isCloseRange
                ? "nr"
                : weapon.system.isPointBlank
                  ? "cr"
                  : "pb",
          gridRow,
        }}
      >
        <Button
          css={{ width: "1em", padding: "0.2em 0.1em" }}
          onClick={weaponRangeReduce}
        >
          <i className="fa fa-chevron-left" />
        </Button>
        {weapon.system.isLongRange || (
          <Button
            css={{ width: "1em", padding: "0.2em 0.1em" }}
            onClick={weaponRangeExpand}
          >
            <i className="fa fa-chevron-right" />
          </Button>
        )}
      </div>

      {/* delete */}
      <Button
        css={{
          gridColumn: "delete",
          gridRow,
          width: "1.6em",
          padding: "0.2em 0.1em",
          // margin: "0.5em 0.5em 0 0",
        }}
        onClick={onClickDelete}
      >
        <i className="fa fa-trash" />
      </Button>

      {/* SIDEBAR */}
      <div
        css={{
          gridColumn: "ammo",
          gridRow: gridRow + 1,
        }}
      >
        <OtherableDropDown
          value={weapon.system.ability}
          onChange={(e) => weapon.system.setAbility(e)}
          pickerValues={settings.combatAbilities.get().toSorted()}
        />
        <div css={{ marginTop: "0.5em" }}>
          <label>
            Use ammo?{" "}
            <Toggle
              checked={weapon.system.usesAmmo}
              onChange={weapon.system.setUsesAmmo}
            />
          </label>
        </div>
        {weapon.system.usesAmmo && (
          <>
            Current
            <AsyncNumberInput
              min={0}
              value={weapon.system.ammo.value}
              onChange={weapon.system.setAmmo}
            />
            Maximum
            <AsyncNumberInput
              min={0}
              value={weapon.system.ammo.max}
              onChange={weapon.system.setAmmoMax}
            />
          </>
        )}
      </div>

      <CompactNotesEditor
        css={{
          gridColumn: "notes / -1",
          gridRow: gridRow + 1,
        }}
        note={weapon.system.notes}
        onChange={weapon.system.setNotes}
      />
    </>
  );
};
