import { memo } from "react";

import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { useIsDocumentLimited } from "../../hooks/useIsDocumentLimited";
import { useItemSnapshot } from "../../hooks/useItemSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import type { EquipmentSystemData } from "../../module/items/equipment";
import { assertEquipmentItem } from "../../module/items/equipment";
import { ModeSelect } from "../ItemSheetFramework/ModeSelect";
import { ItemSheetFramework } from "../ItemSheetFramework/SheetFramework";
import { ItemSheetMode } from "../ItemSheetFramework/types";
import { Translate } from "../Translate";
import { EquipmentConfig } from "./EquipmentConfig";
import { EquipmentMain } from "./EquipmentMain";

/**
 * Everything below here reads the item and settings through snapshots (passed
 * down as props), so its memoised parts only re-render when what they show
 * changes. The item itself is passed down only to write through.
 *
 * Memoised itself (it has no props), so Foundry re-rendering the sheet stops
 * here: the snapshots have already brought in any change.
 */
export const EquipmentSheet = memo(function EquipmentSheet() {
  const { item } = useItemSheetContext();

  assertEquipmentItem(item);
  const snapshot = useItemSnapshot<EquipmentSystemData>(item);
  const categories = useSettings((s) => s.equipmentCategories);
  const isLimited = useIsDocumentLimited();
  const name = useAsyncUpdate(snapshot.name, item.setName);

  return (
    <ItemSheetFramework supertitle={<Translate>Equipment</Translate>}>
      <ModeSelect mode={ItemSheetMode.Main}>
        <EquipmentMain
          item={item}
          system={snapshot.system}
          categories={categories}
          isLimited={isLimited}
          name={name.display}
          onChangeName={name.onChange}
        />
      </ModeSelect>
      <ModeSelect mode={ItemSheetMode.Config}>
        <EquipmentConfig
          item={item}
          system={snapshot.system}
          categories={categories}
        />
      </ModeSelect>
    </ItemSheetFramework>
  );
});
