import { memo } from "react";

import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useItemSnapshot } from "../../hooks/useItemSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import {
  isGeneralAbilitySnapshot,
  isPushOrQuickShock,
} from "../../module/items/abilitySnapshots";
import type { AbilitySystemData } from "../../module/items/exports";
import { assertAbilityItem } from "../../module/items/exports";
import { ModeSelect } from "../ItemSheetFramework/ModeSelect";
import { ItemSheetFramework } from "../ItemSheetFramework/SheetFramework";
import { ItemSheetMode } from "../ItemSheetFramework/types";
import { Translate } from "../Translate";
import { AbilityConfig } from "./AbilityConfig";
import { AbilityMainBits } from "./AbilityMainBits";
import { AbilityMwExtraFields } from "./AbilityMwExtraFields";
import { AbilityTest } from "./AbilityTest";
import { AbilityTestMW } from "./AbilityTestMW";
import { PushPoolButton } from "./PushPoolButton";

/**
 * Everything below here reads the ability (and its actor, and settings)
 * through snapshots, so its memoised parts only re-render when what they show
 * changes. The item itself is passed down only to write through.
 *
 * Memoised itself (it has no props), so Foundry re-rendering the sheet stops
 * here: the snapshots have already brought in any change.
 */
export const AbilitySheet = memo(function AbilitySheet() {
  const { item } = useItemSheetContext();
  assertAbilityItem(item);
  const ability = useItemSnapshot<AbilitySystemData>(item) as AbilitySnapshot;
  const useMwStyleAbilities = useSettings((s) => s.useMwStyleAbilities);
  const actorName = useActorSnapshot(item.actor, (actor) => actor?.name);

  const isGeneral = isGeneralAbilitySnapshot(ability);

  return (
    <ItemSheetFramework
      supertitle={
        <>
          <Translate>
            {isGeneral ? "General ability" : "Investigative ability"}
          </Translate>
          {actorName !== undefined && <span> ({actorName})</span>}
        </>
      }
    >
      <ModeSelect mode={ItemSheetMode.Config}>
        <AbilityConfig item={item} ability={ability} />
      </ModeSelect>
      <ModeSelect mode={ItemSheetMode.Main}>
        <>
          {/* Spending/testing area: Moribund World's test and spend box, a
              push pool's PUSH button, or a spend/test box */}
          {item.isOwned && useMwStyleAbilities && isGeneral ? (
            <AbilityTestMW item={item} pool={ability.system.pool} />
          ) : isPushOrQuickShock(ability) ? (
            <PushPoolButton item={item} />
          ) : (
            <AbilityTest item={item} ability={ability} />
          )}

          {/* Other bits */}
          <AbilityMainBits item={item} ability={ability} />
          {useMwStyleAbilities && isGeneral && (
            <AbilityMwExtraFields
              item={item}
              trumps={ability.system.mwTrumps}
              trumpedBy={ability.system.mwTrumpedBy}
            />
          )}
        </>
      </ModeSelect>
    </ItemSheetFramework>
  );
});
