import { memo } from "react";

import { useDragStart } from "../../../hooks/useDragStart";
import { openSheet } from "../../../functions/openSheet";
import { getTranslated } from "../../../functions/getTranslated";
import { useItemSelector } from "../../../hooks/useItemSnapshot";
import type { WeaponItem } from "../../../module/items/weapon";
import { DeleteItemButton } from "../../inputs/DeleteItemButton";
import { Toggle } from "../../inputs/Toggle";
import { ItemNameWithIcon } from "../ItemNameWithIcon";
import { row as rowClass } from "../../../styled-system/recipes";
import { css, cx } from "../../../styled-system/css";

type WeaponRowProps = {
  /** The live weapon: the row reads it through a snapshot */
  weapon: WeaponItem;
  isReady: boolean;
  setReady: (weapon: WeaponItem, ready: boolean) => void;
};

/**
 * A weapon in the Combat tab's table: click it to open its sheet, or delete it
 * with the button at the end
 */
export const WeaponRow = memo(function WeaponRow({
  weapon,
  isReady,
  setReady,
}: WeaponRowProps) {
  const row = useItemSelector(weapon, (snapshot) => ({
    name: snapshot.name,
    img: snapshot.img,
    usesAmmo: snapshot.system.usesAmmo,
    ammo: snapshot.system.ammo,
    ability: snapshot.system.ability,
  }));
  const onDragStart = useDragStart();

  const openWeaponSheet = () => {
    openSheet(weapon);
  };

  return (
    <>
      <div
        className={css({
          gridColumn: 1,
          display: "flex",
          alignItems: "center",
          paddingInline: "0.25em",
        })}
      >
        <Toggle
          checked={isReady}
          onChange={(ready) => setReady(weapon, ready)}
          label={getTranslated("ReadyWeaponName", {
            WeaponName: row.name,
          })}
        />
      </div>
      <div
        role="button"
        tabIndex={0}
        className={cx(
          rowClass({ interactive: true }),
          css({
            gridColumn: "2 / -2",
            display: "grid",
            gridTemplateColumns: "subgrid",
            alignItems: "center",
            padding: "0.2em 0",
            borderRadius: "[0.2em]",
            "& > *": { paddingInline: "0.25em" },
          }),
        )}
        onClick={openWeaponSheet}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openWeaponSheet();
          }
        }}
        data-item-id={weapon.id}
        draggable="true"
        onDragStart={onDragStart}
      >
        <ItemNameWithIcon item={row} />
        <span className={css({ textAlign: "center" })}>
          {row.usesAmmo ? `${row.ammo.value}/${row.ammo.max}` : "—"}
        </span>
        <span className={css({ overflow: "hidden", textOverflow: "ellipsis" })}>
          {row.ability}
        </span>
      </div>
      <DeleteItemButton item={weapon} />
    </>
  );
});
