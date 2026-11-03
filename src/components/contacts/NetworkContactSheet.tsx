import { memo } from "react";

import { useActorAndSettings } from "../../hooks/useActorSnapshot";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import * as constants from "../../constants";
import { assertNetworkContactItem } from "../../module/items/networkContact";
import { getNetworkAbilityIn } from "../../module/actors/pcDerived";
import { ModeSelect } from "../ItemSheetFramework/ModeSelect";
import { ItemSheetFramework } from "../ItemSheetFramework/SheetFramework";
import { ItemSheetMode } from "../ItemSheetFramework/types";
import { NetworkContactConfig } from "./NetworkContactConfig";
import { NetworkContactMain } from "./NetworkContactMain";

/**
 * Reads the contact, its PC's Network ability and the settings through
 * snapshots, passed down as props (the item itself only to write through).
 * Memoised (it has no props).
 */
export const NetworkContactSheet = memo(function NetworkContactSheet() {
  const { item } = useItemSheetContext();
  assertNetworkContactItem(item);
  const view = useItemSelector(item, (snapshot) => ({
    name: snapshot.name,
    system: snapshot.system,
  }));
  const networkName = useSettings((s) => s.networkAbility);
  // only a PC's contacts can be given points, from its Network ability
  const owner = useActorAndSettings(item.actor, (actor, settings) =>
    actor?.type === constants.pc
      ? {
          networkPool:
            getNetworkAbilityIn(actor.items, settings)?.system.pool ?? null,
        }
      : null,
  );

  return (
    <ItemSheetFramework>
      <ModeSelect mode={ItemSheetMode.Main}>
        <NetworkContactMain
          item={item}
          name={view.name}
          system={view.system}
          isOnPC={owner !== null}
          networkPool={owner?.networkPool ?? null}
          networkName={networkName}
        />
      </ModeSelect>
      <ModeSelect mode={ItemSheetMode.Config}>
        <NetworkContactConfig item={item} pool={view.system.pool} />
      </ModeSelect>
    </ItemSheetFramework>
  );
});
