import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertNetworkContactItem } from "../../module/items/networkContact";
import { ModeSelect } from "../ItemSheetFramework/ModeSelect";
import { ItemSheetFramework } from "../ItemSheetFramework/SheetFramework";
import { ItemSheetMode } from "../ItemSheetFramework/types";
import { NetworkContactConfig } from "./NetworkContactConfig";
import { NetworkContactMain } from "./NetworkContactMain";

export const NetworkContactSheet = () => {
  const { item } = useItemSheetContext();
  assertNetworkContactItem(item);

  return (
    <ItemSheetFramework>
      <ModeSelect mode={ItemSheetMode.Main}>
        <NetworkContactMain />
      </ModeSelect>
      <ModeSelect mode={ItemSheetMode.Config}>
        <NetworkContactConfig />
      </ModeSelect>
    </ItemSheetFramework>
  );
};

NetworkContactSheet.displayName = "NetworkContactSheet";
