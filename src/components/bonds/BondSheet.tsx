import { Router } from "@lumphammer/minirouter";

import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertBondItem } from "../../module/items/bond";
import { ModeSelect } from "../ItemSheetFramework/ModeSelect";
import { ItemSheetFramework } from "../ItemSheetFramework/SheetFramework";
import { ItemSheetMode } from "../ItemSheetFramework/types";
import { SlideInNestedPanelRoute } from "../nestedPanels/SlideInNestedPanelRoute";
import { BondConfig } from "./BondConfig";
import { BondMain } from "./BondMain";
import { rebuild } from "./directions";
import { RebuildBondPanel } from "./RebuildBondPanel";

export const BondSheet = () => {
  const { item } = useItemSheetContext();
  assertBondItem(item);

  return (
    <Router>
      <ItemSheetFramework>
        <ModeSelect mode={ItemSheetMode.Main}>
          <BondMain />
        </ModeSelect>
        <ModeSelect mode={ItemSheetMode.Config}>
          <BondConfig />
        </ModeSelect>
      </ItemSheetFramework>
      <SlideInNestedPanelRoute direction={rebuild}>
        <RebuildBondPanel bond={item} />
      </SlideInNestedPanelRoute>
    </Router>
  );
};

BondSheet.displayName = "BondSheet";
