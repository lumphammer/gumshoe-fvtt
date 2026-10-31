// A character's abilities, laid out for their sheet: worked out from a plain
// view of their items (a snapshot, or the live actor's items) and the
// settings to go by, so converted sheets can use them on snapshots (see
// docs/immutable-data.md) and the character model on itself.

import * as c from "../../constants";
import type { SettingsView } from "../../settings/settingsView";
import { liveSettings } from "../../settings/settingsView";
import { getPushPoolWarningKeys } from "./getPushPoolWarningKeys";
import type { ItemView } from "./pcDerived";

const systemOf = (item: ItemView) =>
  item.system as {
    categoryId?: string;
    hideIfZeroRated?: boolean;
    rating?: number;
    isPushPool?: boolean;
    isQuickShock?: boolean;
  };

export type CategorizedAbilities<T> = {
  investigativeAbilities: Record<string, T[]>;
  generalAbilities: Record<string, T[]>;
};

/**
 * A character's abilities by category: every category from the settings (even
 * when empty), then any others the abilities have, in the order the actor has
 * them
 */
export function getCategorizedAbilitiesIn<T extends ItemView>(
  items: readonly T[],
  {
    hideZeroRated,
    hidePushPool,
  }: { hideZeroRated: boolean; hidePushPool: boolean },
  s: SettingsView = liveSettings,
): CategorizedAbilities<T> {
  const investigativeAbilities: Record<string, T[]> = Object.fromEntries(
    s.investigativeAbilityCategories.map((cat) => [cat, []]),
  );
  const generalAbilities: Record<string, T[]> = Object.fromEntries(
    s.generalAbilityCategories.map((cat) => [cat, []]),
  );
  for (const item of items) {
    const system = systemOf(item);
    const isInvestigative = item.type === c.investigativeAbility;
    if (!isInvestigative && item.type !== c.generalAbility) {
      continue;
    }
    if (hideZeroRated && system.hideIfZeroRated && system.rating === 0) {
      continue;
    }
    if (!isInvestigative && hidePushPool && system.isPushPool) {
      continue;
    }
    const categories = isInvestigative
      ? investigativeAbilities
      : generalAbilities;
    const cat = system.categoryId || "Uncategorised";
    (categories[cat] ??= []).push(item);
  }
  return { investigativeAbilities, generalAbilities };
}

/** The general ability which is the character's push pool, if any */
export function getPushPoolIn<T extends ItemView>(
  items: readonly T[],
): T | undefined {
  return items.find(
    (item) => item.type === c.generalAbility && systemOf(item).isPushPool,
  );
}

/** What's wrong with how push pools are set up, as translation keys */
export function getPushPoolWarningKeysIn(items: readonly ItemView[]): string[] {
  const pools = items.filter(
    (item) => item.type === c.generalAbility && systemOf(item).isPushPool,
  );
  const quickShock = items.filter(
    (item) =>
      item.type === c.investigativeAbility && systemOf(item).isQuickShock,
  );
  return getPushPoolWarningKeys(pools.length, quickShock.length);
}
