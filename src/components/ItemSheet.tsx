import { CSSObject } from "@emotion/react";
import React from "react";
import { equipment, mwItem, weapon } from "../constants";
import { InvestigatorItem } from "../module/InvestigatorItem";
import { EquipmentSheet } from "./equipment/EquipmentSheet";
import { AbilitySheet } from "./abilities/AbilitySheet";
import { WeaponSheet } from "./equipment/WeaponSheet";
import { CSSReset } from "./CSSReset";
import { isAbilityDataSource, isMwItemDataSource } from "../typeAssertions";
import { MwItemSheet } from "./equipment/MwItemSheet";

type ItemSheetProps = {
  item: InvestigatorItem,
  foundryApplication: ItemSheet,
};

/**
 * We only register one "Item" sheet with foundry and then dispatch based on
 * type here.
 */
export const ItemSheet: React.FC<ItemSheetProps> = ({
  item,
  foundryApplication,
}) => {
  const theme = item.getTheme();

  const style: CSSObject = isAbilityDataSource(item.data) || isMwItemDataSource(item.data)
    ? {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }
    : {
        position: "relative",
      };

  return (
    <CSSReset
      theme={theme}
      mode="small"
      css={style}
    >
      {isAbilityDataSource(item.data)
        ? <AbilitySheet ability={item} application={foundryApplication} />
        : item.type === equipment
          ? <EquipmentSheet equipment={item} application={foundryApplication} />
          : item.type === weapon
            ? <WeaponSheet weapon={item} application={foundryApplication} />
            : item.type === mwItem
              ? <MwItemSheet item={item} application={foundryApplication} />
              : <div>No sheet defined for item type &ldquo;{}&rdquo;</div>
      }
    </CSSReset>
  );
};
