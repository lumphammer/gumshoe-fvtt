import { Router } from "@lumphammer/minirouter";
import { memo } from "react";

import * as constants from "../../constants";
import { useActorAndSettings } from "../../hooks/useActorSnapshot";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import {
  getBondCapIn,
  getStabilityViewIn,
} from "../../module/actors/pcDerived";
import { assertBondItem } from "../../module/items/bond";
import { ModeSelect } from "../ItemSheetFramework/ModeSelect";
import { ItemSheetFramework } from "../ItemSheetFramework/SheetFramework";
import { ItemSheetMode } from "../ItemSheetFramework/types";
import { SlideInNestedPanelRoute } from "../nestedPanels/SlideInNestedPanelRoute";
import { BondConfig } from "./BondConfig";
import type { BondOwner } from "./BondMain";
import { BondMain } from "./BondMain";
import { rebuild } from "./directions";
import { RebuildBondPanel } from "./RebuildBondPanel";

/**
 * Reads the Bond, and what it needs from its PC (their Stability ability and
 * Bond cap), through snapshots, passed down as props (the item itself only to
 * write through). Memoised (it has no props).
 */
export const BondSheet = memo(function BondSheet() {
  const { item } = useItemSheetContext();
  assertBondItem(item);
  const view = useItemSelector(item, (snapshot) => ({
    name: snapshot.name,
    system: snapshot.system,
  }));
  // only Bonds on a PC can be burned or rebuilt
  const owner = useActorAndSettings(
    item.actor,
    (actor, settings): BondOwner | null =>
      actor?.type === constants.pc
        ? {
            stability: getStabilityViewIn(actor.items, settings),
            bondCap: getBondCapIn(actor, settings),
          }
        : null,
  );

  return (
    <Router>
      <ItemSheetFramework>
        <ModeSelect mode={ItemSheetMode.Main}>
          <BondMain
            item={item}
            name={view.name}
            system={view.system}
            owner={owner}
          />
        </ModeSelect>
        <ModeSelect mode={ItemSheetMode.Config}>
          <BondConfig item={item} />
        </ModeSelect>
      </ItemSheetFramework>
      <SlideInNestedPanelRoute direction={rebuild}>
        <RebuildBondPanel bond={item} />
      </SlideInNestedPanelRoute>
    </Router>
  );
});
