import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertEquipmentItem } from "../../module/items/equipment";
import { ModeSelect } from "../ItemSheetFramework/ModeSelect";
import { ItemSheetFramework } from "../ItemSheetFramework/SheetFramework";
import { ItemSheetMode } from "../ItemSheetFramework/types";
import { Translate } from "../Translate";
import { EquipmentConfig } from "./EquipmentConfig";
import { EquipmentMain } from "./EquipmentMain";

export const EquipmentSheet = () => {
  const { item } = useItemSheetContext();

  assertEquipmentItem(item);
  const name = useAsyncUpdate(item.name || "", item.setName);

  return (
    <ItemSheetFramework supertitle={<Translate>Equipment</Translate>}>
      <ModeSelect mode={ItemSheetMode.Main}>
        <EquipmentMain name={name.display} onChangeName={name.onChange} />
      </ModeSelect>
      <ModeSelect mode={ItemSheetMode.Config}>
        <EquipmentConfig />
      </ModeSelect>
    </ItemSheetFramework>
  );
};
