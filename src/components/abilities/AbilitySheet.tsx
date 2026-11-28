import { memo } from "react";

import { useItemSnapshot } from "../../hooks/useItemSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { isGeneralAbilitySnapshot } from "../../module/items/abilitySnapshots";
import { assertAbilityItem } from "../../module/items/exports";
import { ModeSelect } from "../ItemSheetFramework/ModeSelect";
import { ItemSheetFramework } from "../ItemSheetFramework/SheetFramework";
import { ItemSheetMode } from "../ItemSheetFramework/types";
import { AbilityConfig } from "./AbilityConfig";
import { AbilityMainBits } from "./AbilityMainBits";
import { AbilityMwExtraFields } from "./AbilityMwExtraFields";
import { AbilityRollControls } from "./AbilityRollControls";

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
  const ability = useItemSnapshot(item);
  const useMwStyleAbilities = useSettings((s) => s.useMwStyleAbilities);

  const isGeneral = isGeneralAbilitySnapshot(ability);

  return (
    <ItemSheetFramework>
      <ModeSelect mode={ItemSheetMode.Config}>
        <AbilityConfig item={item} ability={ability} />
      </ModeSelect>
      <ModeSelect mode={ItemSheetMode.Main}>
        <>
          <AbilityRollControls item={item} ability={ability} />

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
