import { memo } from "react";

import { confirmAndDeleteItem } from "../../../functions/confirmAndDeleteItem";
import { useItemSelector } from "../../../hooks/useItemSnapshot";
import { useSettings } from "../../../hooks/useSettings";
import { useSystemMethods } from "../../../hooks/useSystemMethods";
import type { WeaponItem } from "../../../module/items/weapon";
import { AsyncNumberInput } from "../../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { Button } from "../../inputs/Button";
import { IndexedRichTextEditor } from "../../inputs/IndexedRichTextEditor";
import { OtherableDropDown } from "../../inputs/OtherableDropDown";
import { Toggle } from "../../inputs/Toggle";
import { row as rowClass } from "../../../styled-system/recipes";
import { css, cx } from "../../../styled-system/css";

// the icons get Font Awesome's fixed width (1.25em), which is wider than the
// button, so they stuck out to the right: let them be as wide as the chevron
const rangeButtonStyle = {
  width: "1em",
  padding: "0.2em 0",
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  "& > i": { width: "auto" },
};

type WeaponRowEditProps = {
  /** The live weapon: the row reads it through a snapshot */
  weapon: WeaponItem;
  index: number;
};

export const WeaponRowEdit = memo(function WeaponRowEdit({
  weapon,
  index,
}: WeaponRowEditProps) {
  const row = useItemSelector(weapon, ({ name, system: s }) => ({
    name,
    damage: s.damage,
    isPointBlank: s.isPointBlank,
    pointBlankDamage: s.pointBlankDamage,
    isCloseRange: s.isCloseRange,
    closeRangeDamage: s.closeRangeDamage,
    isNearRange: s.isNearRange,
    nearRangeDamage: s.nearRangeDamage,
    isLongRange: s.isLongRange,
    longRangeDamage: s.longRangeDamage,
    isExtendedRange: s.isExtendedRange,
    extendedRangeDamage: s.extendedRangeDamage,
    ability: s.ability,
    usesAmmo: s.usesAmmo,
    ammo: s.ammo,
    notes: s.notes,
  }));
  const m = useSystemMethods(weapon);
  const { useExtendedRange, combatAbilities } = useSettings((s) => ({
    useExtendedRange: s.useExtendedRange,
    combatAbilities: s.combatAbilities,
  }));
  const hasExtendedRange = useExtendedRange && row.isExtendedRange;

  const weaponRangeReduce = async () => {
    if (hasExtendedRange) {
      await weapon.system.setIsExtendedRange(false);
    } else if (weapon.system.isLongRange) {
      await weapon.system.setIsLongRange(false);
    } else if (weapon.system.isNearRange) {
      await weapon.system.setIsNearRange(false);
    } else if (weapon.system.isCloseRange) {
      await weapon.system.setIsCloseRange(false);
    }
  };
  const weaponRangeExpand = async () => {
    if (!weapon.system.isCloseRange) {
      await weapon.system.setIsCloseRange(true);
    } else if (!weapon.system.isNearRange) {
      await weapon.system.setIsNearRange(true);
    } else if (!weapon.system.isLongRange) {
      await weapon.system.setIsLongRange(true);
    } else if (useExtendedRange && !weapon.system.isExtendedRange) {
      await weapon.system.setIsExtendedRange(true);
    }
  };

  const damageInputs = [
    ["base", true, row.damage, m.setDamage],
    ["pb", row.isPointBlank, row.pointBlankDamage, m.setPointBlankDamage],
    ["cr", row.isCloseRange, row.closeRangeDamage, m.setCloseRangeDamage],
    ["nr", row.isNearRange, row.nearRangeDamage, m.setNearRangeDamage],
    ["lr", row.isLongRange, row.longRangeDamage, m.setLongRangeDamage],
    ["er", hasExtendedRange, row.extendedRangeDamage, m.setExtendedRangeDamage],
  ] as const;

  const gridRow = index * 3 + 3;

  return (
    <>
      <div
        className={cx(
          rowClass({ alternate: true }),
          css({
            gridColumn: "1/-1",
            margin: "-0.5em",
          }),
        )}
        style={{ gridRow: `${gridRow}/${gridRow + 2}` }}
      />
      <div
        className={css({
          gridColumn: "1/-1",
          height: "0.5em",
        })}
        style={{ gridRow: `${gridRow + 2}/${gridRow + 3}` }}
      />

      {/* NAME */}
      <AsyncTextInput
        className={css({
          gridColumn: "name",
        })}
        style={{ gridRow }}
        value={row.name}
        onChange={weapon.setName}
      />
      {damageInputs.map(
        ([column, shown, value, onChange]) =>
          shown && (
            <AsyncNumberInput
              key={column}
              value={value}
              onChange={onChange}
              noPlusMinus
              style={{ gridColumn: column, gridRow }}
            />
          ),
      )}

      {/* left/right arrows */}
      <div
        className={css({
          gridColumn: hasExtendedRange
            ? "back"
            : row.isLongRange
              ? useExtendedRange
                ? "er"
                : "back"
              : row.isNearRange
                ? "lr"
                : row.isCloseRange
                  ? "nr"
                  : row.isPointBlank
                    ? "cr"
                    : "pb",
          // the buttons stretch to the height of the inputs beside them
          display: "flex",
        })}
        style={{ gridRow }}
      >
        <Button className={css(rangeButtonStyle)} onClick={weaponRangeReduce}>
          <i className="fa fa-chevron-left" />
        </Button>
        {(useExtendedRange ? hasExtendedRange : row.isLongRange) || (
          <Button className={css(rangeButtonStyle)} onClick={weaponRangeExpand}>
            <i className="fa fa-chevron-right" />
          </Button>
        )}
      </div>

      {/* delete */}
      <Button
        className={css({
          gridColumn: "delete",
          width: "1.6em",
          padding: "0.2em 0.1em",
          // margin: "0.5em 0.5em 0 0",
        })}
        style={{ gridRow }}
        onClick={() => void confirmAndDeleteItem(weapon)}
      >
        <i className="fa fa-trash" />
      </Button>

      {/* SIDEBAR */}
      <div
        className={css({
          gridColumn: "ammo",
        })}
        style={{ gridRow: gridRow + 1 }}
      >
        <OtherableDropDown
          value={row.ability}
          onChange={m.setAbility}
          pickerValues={combatAbilities.toSorted()}
        />
        <div className={css({ marginTop: "0.5em" })}>
          <label>
            Use ammo? <Toggle checked={row.usesAmmo} onChange={m.setUsesAmmo} />
          </label>
        </div>
        {row.usesAmmo && (
          <>
            Current
            <AsyncNumberInput
              min={0}
              value={row.ammo.value}
              onChange={m.setAmmo}
            />
            Maximum
            <AsyncNumberInput
              min={0}
              value={row.ammo.max}
              onChange={m.setAmmoMax}
            />
          </>
        )}
      </div>

      <div
        className={css({
          position: "relative",
          gridColumn: "notes / -1",
          minHeight: "6em",
        })}
        style={{ gridRow: gridRow + 1 }}
      >
        <IndexedRichTextEditor
          index={index}
          name="weapon"
          html={row.notes}
          onSave={m.setNotes}
        />
      </div>
    </>
  );
});
