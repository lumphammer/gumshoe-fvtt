import { css, cx } from "../styled-system/css";
import { useActorTheme } from "../hooks/useActorTheme";
import { useItemSheetContext } from "../hooks/useSheetContexts";
import { useSheetPermissions } from "../hooks/useSheetPermissions";
import { SheetPermissionsContext } from "../hooks/useIsEditable";
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
 * `--inv-titlebar-clearance`: how far the window's titlebar reaches down over
 * the sheet. In the full-frame layout it's a see-through strip over the top
 * of it (`appFrame`), and each sheet keeps its controls below it, letting its
 * plain text (a supertitle) run up into it, so there's no band of empty
 * wallpaper above the sheet. Otherwise the titlebar is above the sheet, so 0.
 */
const titlebarClearance = css({
  "--inv-titlebar-clearance": "0px",
  "&[data-inv-layout=full-frame]": {
    "--inv-titlebar-clearance": "var(--header-height)",
  },
});

/**
 * We only register one "Item" sheet with foundry and then dispatch based on
 * type here.
 *
 * Every sheet below reads its item (and anything else it shows) through
 * snapshots, so Foundry's renders don't reach React (the sheet class passes
 * `rerenderOnFoundryRender: false`). The theme follows the owner's.
 */
export const ItemSheet = () => {
  const { item } = useItemSheetContext();
  const permissions = useSheetPermissions(item);
  const theme = useActorTheme(item.actor);

  const className = cx(
    isAbilityItem(item) || isMwItem(item)
      ? css({ position: "absolute", inset: 0 })
      : css({ position: "relative" }),
    titlebarClearance,
  );

  return (
    <CSSReset theme={theme} mode="small" className={className} clearsTitlebar>
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
