import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { useIsDocumentLimited } from "../../hooks/useIsDocumentLimited";
import { useItemSnapshot } from "../../hooks/useItemSnapshot";
import { useSettingSnapshot } from "../../hooks/useSettingSnapshot";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import type { EquipmentSystemData } from "../../module/items/equipment";
import { assertEquipmentItem } from "../../module/items/equipment";
import { settings } from "../../settings/settings";
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
 */
export const EquipmentSheet = () => {
  const { item } = useItemSheetContext();

  assertEquipmentItem(item);
  const snapshot = useItemSnapshot<EquipmentSystemData>(item);
  const categories = useSettingSnapshot(settings.equipmentCategories);
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
};
