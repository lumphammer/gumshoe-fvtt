import { generalAbility } from "../../constants";
import type { InvestigatorItem } from "./InvestigatorItem";

type Named = { readonly type: unknown; readonly name: string | null };

/**
 * Find a general ability by name in a list of items: live items, or item
 * snapshots.
 */
export function findGeneralAbilityIn<T extends Named>(
  items: readonly T[],
  name: string,
): T | undefined {
  return items.find(
    (item) => item.type === generalAbility && item.name === name,
  );
}

/** The names of the general abilities in a list of items (or snapshots). */
export function getGeneralAbilityNamesIn(items: readonly Named[]): string[] {
  return items
    .filter((item) => item.type === generalAbility)
    .map((item) => item.name)
    .filter((name): name is string => name !== null);
}

/**
 * An ability's pool, from its snapshot (or 0 for no ability). Abilities are
 * the only items with a pool.
 */
export function getPoolOf(
  ability: { readonly system: unknown } | undefined,
): number {
  const pool = (ability?.system as { pool?: unknown } | undefined)?.pool;
  return typeof pool === "number" ? pool : 0;
}

/** Find one of an actor's general abilities by name */
export function findGeneralAbility(
  actor: Actor | null,
  name: string,
): InvestigatorItem | undefined {
  return actor
    ? findGeneralAbilityIn(actor.items.contents as InvestigatorItem[], name)
    : undefined;
}
