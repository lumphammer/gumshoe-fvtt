import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertBondItem } from "../../module/items/bond";
import { ModeSelect } from "../ItemSheetFramework/ModeSelect";
import { ItemSheetFramework } from "../ItemSheetFramework/SheetFramework";
import { ItemSheetMode } from "../ItemSheetFramework/types";
import { BondConfig } from "./BondConfig";
import { BondMain } from "./BondMain";

export const BondSheet = () => {
  const { item } = useItemSheetContext();
  assertBondItem(item);

  return (
    <ItemSheetFramework>
      <ModeSelect mode={ItemSheetMode.Main}>
        <BondMain />
      </ModeSelect>
      <ModeSelect mode={ItemSheetMode.Config}>
        <BondConfig />
      </ModeSelect>
    </ItemSheetFramework>
  );
};

BondSheet.displayName = "BondSheet";
