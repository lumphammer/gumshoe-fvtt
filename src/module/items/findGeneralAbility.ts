import { generalAbility } from "../../constants";
import type { OfType } from "../snapshots/snapshotTypes";
import type { InvestigatorItem } from "./InvestigatorItem";

type Named = { readonly type: unknown; readonly name: string | null };

/**
 * Find a general ability by name in a list of items: live items, or item
 * snapshots.
 */
export function findGeneralAbilityIn<T extends Named>(
  items: readonly T[],
  name: string,
): OfType<T, typeof generalAbility> | undefined {
  return items.find(
    (item) => item.type === generalAbility && item.name === name,
  ) as OfType<T, typeof generalAbility> | undefined;
}

/** The names of the general abilities in a list of items (or snapshots). */
export function getGeneralAbilityNamesIn(items: readonly Named[]): string[] {
  return items
    .filter((item) => item.type === generalAbility)
    .map((item) => item.name)
    .filter((name): name is string => name !== null);
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
