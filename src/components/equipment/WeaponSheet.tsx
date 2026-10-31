import { memo } from "react";
import { IsEditableContext } from "../../hooks/useIsEditable";
import { useSheetPermissions } from "../../hooks/useSheetPermissions";

import { useItemSnapshot } from "../../hooks/useItemSnapshot";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import type { WeaponSystemData } from "../../module/items/weapon";
import { assertWeaponItem } from "../../module/items/weapon";
import { ModeSelect } from "../ItemSheetFramework/ModeSelect";
import { ItemSheetFramework } from "../ItemSheetFramework/SheetFramework";
import { ItemSheetMode } from "../ItemSheetFramework/types";
import { Translate } from "../Translate";
import { WeaponConfig } from "./WeaponConfig";
import { WeaponMain } from "./WeaponMain";

/**
 * Everything below here reads the weapon (and its actor, and settings) through
 * snapshots, so its memoised parts only re-render when what they show changes.
 * The item itself is passed down only to write through.
 *
 * Memoised itself (it has no props), so Foundry re-rendering the sheet stops
 * here: the snapshots have already brought in any change.
 */
export const WeaponSheet = memo(function WeaponSheet() {
  const { item } = useItemSheetContext();
  assertWeaponItem(item);
  const { isEditable } = useSheetPermissions(item);
  const weapon = useItemSnapshot<WeaponSystemData>(item);

  return (
    <IsEditableContext.Provider value={isEditable}>
      <ItemSheetFramework supertitle={<Translate>Weapon</Translate>}>
        <ModeSelect mode={ItemSheetMode.Main}>
          <WeaponMain item={item} notes={weapon.system.notes} />
        </ModeSelect>
        <ModeSelect mode={ItemSheetMode.Config}>
          <WeaponConfig item={item} weapon={weapon} />
        </ModeSelect>
      </ItemSheetFramework>
    </IsEditableContext.Provider>
  );
});
