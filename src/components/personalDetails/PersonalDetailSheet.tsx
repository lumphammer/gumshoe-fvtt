import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertPersonalDetailItem } from "../../module/items/personalDetail";
import { ModeSelect } from "../ItemSheetFramework/ModeSelect";
import { ItemSheetFramework } from "../ItemSheetFramework/SheetFramework";
import { ItemSheetMode } from "../ItemSheetFramework/types";
import { PersonalDetailConfig } from "./PersonalDetailConfig";
import { PersonalDetailMain } from "./PersonalDetailMain";

export const PersonalDetailSheet = () => {
  const { item } = useItemSheetContext();
  assertPersonalDetailItem(item);

  return (
    <ItemSheetFramework>
      <ModeSelect mode={ItemSheetMode.Main}>
        <PersonalDetailMain />
      </ModeSelect>
      <ModeSelect mode={ItemSheetMode.Config}>
        <PersonalDetailConfig />
      </ModeSelect>
    </ItemSheetFramework>
  );
};

PersonalDetailSheet.displayName = "PersonalDetailSheet";
