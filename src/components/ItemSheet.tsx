import type { CSSObject } from "@emotion/react";

import * as constants from "../constants";
import { useActorSnapshot } from "../hooks/useActorSnapshot";
import { useSettings } from "../hooks/useSettings";
import { useItemSheetContext } from "../hooks/useSheetContexts";
import { useSheetPermissions } from "../hooks/useSheetPermissions";
import { SheetPermissionsContext } from "../hooks/useIsEditable";
import { useTheme } from "../hooks/useTheme";
import { isBondItem } from "../module/items/bond";
import { isNetworkContactItem } from "../module/items/networkContact";
import { isCardItem } from "../module/items/card";
import { isEquipmentItem } from "../module/items/equipment";
import { isAbilityItem } from "../module/items/exports";
import { isMwItem } from "../module/items/mwItem";
import { isPersonalDetailItem } from "../module/items/personalDetail";
import { isWeaponItem } from "../module/items/weapon";
import { AbilitySheet } from "./abilities/AbilitySheet";
import { BondSheet } from "./bonds/BondSheet";
import { NetworkContactSheet } from "./contacts/NetworkContactSheet";
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
 *
 * Every sheet below reads its item (and anything else it shows) through
 * snapshots, so Foundry's renders don't reach React (the sheet class passes
 * `rerenderOnFoundryRender: false`). The theme follows the owner's, as
 * `InvestigatorItem#getThemeName` does.
 */
export const ItemSheet = () => {
  "use memo";

  const { item } = useItemSheetContext();
  const permissions = useSheetPermissions(item);
  const ownerTheme = useActorSnapshot(item.actor, (actor) =>
    actor?.type === constants.pc || actor?.type === constants.npc
      ? actor.system.sheetTheme
      : null,
  );
  const defaultThemeName = useSettings((s) => s.defaultThemeName);
  const theme = useTheme(ownerTheme || defaultThemeName);

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
      <SheetPermissionsContext value={permissions}>
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
          ) : isBondItem(item) ? (
            <BondSheet />
          ) : isNetworkContactItem(item) ? (
            <NetworkContactSheet />
          ) : (
            <ThrowError
              message={`No sheet defined for item type ${item.type}`}
            />
          )}
        </NotesTypeContext.Provider>
      </SheetPermissionsContext>
    </CSSReset>
  );
};
