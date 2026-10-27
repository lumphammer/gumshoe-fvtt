import { useCallback, useContext } from "react";

import { confirmAndDeleteItem } from "../../../functions/confirmAndDeleteItem";
import type { WeaponItem } from "../../../module/items/weapon";
import { settings } from "../../../settings/settings";
import { ThemeContext } from "../../../themes/ThemeContext";
import { AsyncNumberInput } from "../../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { Button } from "../../inputs/Button";
import { IndexedRichTextEditor } from "../../inputs/IndexedRichTextEditor";
import { OtherableDropDown } from "../../inputs/OtherableDropDown";
import { Toggle } from "../../inputs/Toggle";

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
  weapon: WeaponItem;
  index: number;
};

export const WeaponRowEdit = ({ weapon, index }: WeaponRowEditProps) => {
  const theme = useContext(ThemeContext);

  const useExtendedRange = settings.useExtendedRange.get();
  const hasExtendedRange = useExtendedRange && weapon.system.isExtendedRange;

  const weaponRangeReduce = useCallback(async () => {
    if (hasExtendedRange) {
      await weapon.system.setIsExtendedRange(false);
    } else if (weapon.system.isLongRange) {
      await weapon.system.setIsLongRange(false);
    } else if (weapon.system.isNearRange) {
      await weapon.system.setIsNearRange(false);
    } else if (weapon.system.isCloseRange) {
      await weapon.system.setIsCloseRange(false);
    }
  }, [weapon, hasExtendedRange]);
  const weaponRangeExpand = useCallback(async () => {
    if (!weapon.system.isCloseRange) {
      await weapon.system.setIsCloseRange(true);
    } else if (!weapon.system.isNearRange) {
      await weapon.system.setIsNearRange(true);
    } else if (!weapon.system.isLongRange) {
      await weapon.system.setIsLongRange(true);
    } else if (useExtendedRange && !weapon.system.isExtendedRange) {
      await weapon.system.setIsExtendedRange(true);
    }
  }, [weapon, useExtendedRange]);

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
      {hasExtendedRange && (
        <AsyncNumberInput
          value={weapon.system.extendedRangeDamage}
          onChange={weapon.system.setExtendedRangeDamage}
          noPlusMinus
          css={{ gridColumn: "er", gridRow }}
        />
      )}

      {/* left/right arrows */}
      <div
        css={{
          gridColumn: hasExtendedRange
            ? "back"
            : weapon.system.isLongRange
              ? useExtendedRange
                ? "er"
                : "back"
              : weapon.system.isNearRange
                ? "lr"
                : weapon.system.isCloseRange
                  ? "nr"
                  : weapon.system.isPointBlank
                    ? "cr"
                    : "pb",
          gridRow,
          // the buttons stretch to the height of the inputs beside them
          display: "flex",
        }}
      >
        <Button css={rangeButtonStyle} onClick={weaponRangeReduce}>
          <i className="fa fa-chevron-left" />
        </Button>
        {(useExtendedRange ? hasExtendedRange : weapon.system.isLongRange) || (
          <Button css={rangeButtonStyle} onClick={weaponRangeExpand}>
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
        onClick={() => void confirmAndDeleteItem(weapon)}
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

      <div
        css={{
          position: "relative",
          gridColumn: "notes / -1",
          gridRow: gridRow + 1,
          minHeight: "6em",
        }}
      >
        <IndexedRichTextEditor
          index={index}
          name="weapon"
          html={weapon.system.notes}
          onSave={weapon.system.setNotes}
        />
      </div>
    </>
  );
};
