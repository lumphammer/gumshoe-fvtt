import { Router } from "@lumphammer/minirouter";
import { memo } from "react";

import * as constants from "../../constants";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import {
  getBondCapIn,
  getStabilityAbilityIn,
} from "../../module/actors/pcDerived";
import type { BondSystemData } from "../../module/items/bond";
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
  "use memo";

  const { item } = useItemSheetContext();
  assertBondItem(item);
  const settings = useSettings((s) => s);
  const view = useItemSelector<
    { name: string; system: BondSystemData },
    BondSystemData
  >(item, (snapshot) => ({ name: snapshot.name, system: snapshot.system }));
  // only Bonds on a PC can be burned or rebuilt
  const owner = useActorSnapshot(item.actor, (actor): BondOwner | null => {
    if (actor?.type !== constants.pc) return null;
    const stability = getStabilityAbilityIn(actor.items, settings);
    const system = stability?.system as
      | { pool: number; rating: number }
      | undefined;
    return {
      stability:
        stability && system
          ? { name: stability.name, pool: system.pool, rating: system.rating }
          : null,
      bondCap: getBondCapIn(
        { system: actor.system, items: actor.items },
        settings,
      ),
    };
  });

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
