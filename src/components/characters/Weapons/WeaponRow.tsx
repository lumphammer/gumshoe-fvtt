import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import type React from "react";
import { useContext } from "react";

import { assertApplicationV2 } from "../../../functions/assertApplicationV2";
import { getTranslated } from "../../../functions/getTranslated";
import type { WeaponItem } from "../../../module/items/weapon";
import { ThemeContext } from "../../../themes/ThemeContext";
import { DeleteItemButton } from "../../inputs/DeleteItemButton";
import { Toggle } from "../../inputs/Toggle";
import { ItemNameWithIcon } from "../ItemNameWithIcon";

type WeaponRowProps = {
  weapon: WeaponItem;
  isReady: boolean;
  setReady: (ready: boolean) => void;
};

/**
 * A weapon in the Combat tab's table: click it to open its sheet, or delete it
 * with the button at the end
 */
export const WeaponRow = ({ weapon, isReady, setReady }: WeaponRowProps) => {
  const app = useContext(FoundryAppContext);
  const theme = useContext(ThemeContext);

  const openSheet = () => {
    const sheet = weapon.sheet;
    assertApplicationV2(sheet);
    void sheet.render({ force: true });
  };

  return (
    <>
      <div
        css={{
          gridColumn: 1,
          display: "flex",
          alignItems: "center",
          paddingInline: "0.25em",
        }}
      >
        <Toggle
          checked={isReady}
          onChange={setReady}
          label={getTranslated("ReadyWeaponName", {
            WeaponName: weapon.name,
          })}
        />
      </div>
      <div
        role="button"
        tabIndex={0}
        css={{
          gridColumn: "2 / -2",
          display: "grid",
          gridTemplateColumns: "subgrid",
          alignItems: "center",
          padding: "0.2em 0",
          cursor: "pointer",
          borderRadius: "0.2em",
          "& > *": { paddingInline: "0.25em" },
          "&:hover, &:focus-visible": {
            background: `color-mix(in srgb, ${theme.colors.glow} 25%, transparent)`,
            outline: "none",
          },
        }}
        onClick={openSheet}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openSheet();
          }
        }}
        data-item-id={weapon.id}
        draggable="true"
        onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
          if (app !== null) {
            (app as any)._onDragStart(e);
          }
        }}
      >
        <ItemNameWithIcon item={weapon} css={{ color: theme.colors.accent }} />
        <span css={{ textAlign: "center" }}>
          {weapon.system.usesAmmo
            ? `${weapon.system.ammo.value}/${weapon.system.ammo.max}`
            : "—"}
        </span>
        <span css={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {weapon.system.ability}
        </span>
      </div>
      <DeleteItemButton item={weapon} />
    </>
  );
};
