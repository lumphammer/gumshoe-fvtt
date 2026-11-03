// A character's abilities, laid out for their sheet: worked out from a plain
// view of their items (a snapshot, or the live actor's items) and the
// settings to go by, so converted sheets can use them on snapshots (see
// docs/immutable-data.md) and the character model on itself.

import * as c from "../../constants";
import type { SettingsView } from "../../settings/settingsView";
import { sortEntitiesByName } from "../../functions/utilities";
import { liveSettings } from "../../settings/settingsView";
import { getPushPoolWarningKeys } from "./getPushPoolWarningKeys";
import type { OfType } from "../snapshots/snapshotTypes";
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
): OfType<T, typeof c.generalAbility> | undefined {
  return items.find(
    (item) => item.type === c.generalAbility && systemOf(item).isPushPool,
  ) as OfType<T, typeof c.generalAbility> | undefined;
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

const isAbility = (item: ItemView) =>
  item.type === c.generalAbility || item.type === c.investigativeAbility;

const isPushPool = (item: ItemView) =>
  item.type === c.generalAbility && Boolean(systemOf(item).isPushPool);

/** The abilities with pool trackers: the push pool, then by name */
export function getTrackerAbilitiesIn<T extends ItemView>(
  items: readonly T[],
): T[] {
  return items
    .filter(
      (item) =>
        isAbility(item) &&
        Boolean((item.system as { showTracker?: boolean }).showTracker),
    )
    .toSorted(
      (a, b) =>
        Number(isPushPool(b)) - Number(isPushPool(a)) ||
        a.name.localeCompare(b.name),
    );
}

/** A row of a character's abilities: which ability, and which kind of row */
export type AbilityRow = { id: string; isQuickShock: boolean };

/** Each category's abilities, by name, as the rows need them */
export function getAbilityRowsIn(
  abilities: Readonly<Record<string, readonly ItemView[]>>,
): Record<string, AbilityRow[]> {
  return Object.fromEntries(
    Object.entries(abilities).map(([cat, items]) => [
      cat,
      sortEntitiesByName(items).map((item) => ({
        id: item._id ?? "",
        isQuickShock: Boolean(systemOf(item).isQuickShock),
      })),
    ]),
  );
}

/** The ratings of all these abilities, added up */
export function sumRatingsIn(
  abilities: Readonly<Record<string, readonly ItemView[]>>,
): number {
  return Object.values(abilities)
    .flat()
    .reduce((total, item) => total + (systemOf(item).rating ?? 0), 0);
}

/** Whether there are investigative abilities other than quick-shock ones */
export function hasRegularInvestigativeAbilitiesIn(
  items: readonly ItemView[],
): boolean {
  return items.some(
    (item) =>
      item.type === c.investigativeAbility && !systemOf(item).isQuickShock,
  );
}
