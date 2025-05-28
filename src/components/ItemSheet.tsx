import { CSSObject } from "@emotion/react";

import { useItemSheetContext } from "../hooks/useSheetContexts";
import { useTheme } from "../hooks/useTheme";
import { isCardItem } from "../module/items/card";
import { isEquipmentItem } from "../module/items/equipment";
import { isAbilityItem } from "../module/items/exports";
import { isMwItem } from "../module/items/mwItem";
import { isPersonalDetailItem } from "../module/items/personalDetail";
import { isWeaponItem } from "../module/items/weapon";
import { AbilitySheet } from "./abilities/AbilitySheet";
import { CardSheet } from "./cards/CardSheet";
import { CSSReset } from "./CSSReset";
import { EquipmentSheet } from "./equipment/EquipmentSheet";
import { MwItemSheet } from "./equipment/MwItemSheet";
import { WeaponSheet } from "./equipment/WeaponSheet";
import { NotesTypeContext } from "./NotesTypeContext";
import { PersonalDetailSheet } from "./personalDetails/PersonalDetailSheet";
import { ThrowError } from "./ThrowError";

/**
 * We only register one "Item" sheet with foundry and then dispatch based on
 * type here.
 */
export const ItemSheet = () => {
  const { item } = useItemSheetContext();

  const themeName = item.getThemeName();
  const theme = useTheme(themeName);

  const style: CSSObject =
    isAbilityItem(item) || isMwItem(item)
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
    <CSSReset theme={theme} mode="small" css={style}>
      <NotesTypeContext.Provider value="itemNote">
        {isAbilityItem(item) ? (
          <AbilitySheet />
        ) : isEquipmentItem(item) ? (
          <EquipmentSheet />
        ) : isWeaponItem(item) ? (
          <WeaponSheet />
        ) : isMwItem(item) ? (
          <MwItemSheet />
        ) : isPersonalDetailItem(item) ? (
          <PersonalDetailSheet />
        ) : isCardItem(item) ? (
          <CardSheet />
        ) : (
          <ThrowError message={`No sheet defined for item type ${item.type}`} />
        )}
      </NotesTypeContext.Provider>
    </CSSReset>
  );
};
