import { memo } from "react";

import { useSettings } from "../../hooks/useSettings";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import {
  isGeneralAbilitySnapshot,
  isPushOrQuickShock,
} from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { AbilityTest } from "./AbilityTest";
import { AbilityTestMW } from "./AbilityTestMW";
import { PushPoolButton } from "./PushPoolButton";

interface AbilityRollControlsProps {
  /** Only to write through: read from `ability`. */
  item: AbilityItem;
  ability: AbilitySnapshot;
  /** Called once something has been rolled or spent */
  onDone?: () => void;
}

/**
 * How an ability is tested or spent: Moribund World's test and spend box, a
 * push pool's Push button, or a spend/test box. On the ability's sheet, and in
 * the roll popover on a character sheet's ability rows.
 */
export const AbilityRollControls = memo(function AbilityRollControls({
  item,
  ability,
  onDone,
}: AbilityRollControlsProps) {
  const useMwStyleAbilities = useSettings((s) => s.useMwStyleAbilities);

  return item.isOwned &&
    useMwStyleAbilities &&
    isGeneralAbilitySnapshot(ability) ? (
    <AbilityTestMW item={item} pool={ability.system.pool} onDone={onDone} />
  ) : isPushOrQuickShock(ability) ? (
    <PushPoolButton item={item} onDone={onDone} />
  ) : (
    <AbilityTest item={item} ability={ability} onDone={onDone} />
  );
});
