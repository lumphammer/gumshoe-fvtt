import { isNPCActor } from "../actors/npc";
import { isPCActor } from "../actors/pc";
import { isActiveCharacterActor } from "../actors/types";
import type { GeneralAbilityItem } from "../items/generalAbility";
import { isGeneralAbilityItem } from "../items/generalAbility";

const healthResourceId = "health";

/**
 * Find the general ability which represents an actor's Health. Prefer one
 * explicitly linked to the "health" resource, but fall back to one called
 * "Health" for legacy compatibility, like the resource sync does.
 */
function findHealthAbility(actor: Actor): GeneralAbilityItem | undefined {
  const generalAbilities = actor.items.filter(
    (item): item is GeneralAbilityItem & Item.Stored<"generalAbility"> =>
      isGeneralAbilityItem(item),
  );
  return (
    generalAbilities.find(
      (item) =>
        item.system.linkToResource &&
        item.system.resourceId === healthResourceId,
    ) ??
    generalAbilities.find(
      (item) => item.name.trim().toLowerCase() === healthResourceId,
    )
  );
}

/**
 * Get an actor's current Health, or null if it doesn't seem to have any.
 */
export function getHealth(actor: Actor): number | null {
  const ability = findHealthAbility(actor);
  if (ability) {
    return ability.system.pool;
  }
  if (isActiveCharacterActor(actor)) {
    return actor.system.resources[healthResourceId]?.value ?? null;
  }
  return null;
}

/**
 * Set an actor's Health. We deliberately don't clamp to the ability's minimum:
 * plenty of NPC Health abilities have a minimum of 0, but wound states only
 * mean anything below that.
 */
export async function setHealth(actor: Actor, value: number): Promise<void> {
  const ability = findHealthAbility(actor);
  if (ability) {
    await ability.system.setPool(value);
  } else if (isActiveCharacterActor(actor)) {
    await actor.update({
      system: { resources: { [healthResourceId]: { value } } },
    });
  }
}

/** Read a numeric stat, which may not be configured for this actor type */
export function getStat(actor: Actor, statId: string): number | null {
  if (!isActiveCharacterActor(actor)) {
    return null;
  }
  const value = actor.system.stats[statId];
  return typeof value === "number" ? value : null;
}

/** PCs are always human. NPCs have a flag (ghouls, dogs, etc. aren't). */
export function isHumanActor(actor: Actor): boolean {
  if (isPCActor(actor)) return true;
  if (isNPCActor(actor)) return actor.system.isHuman;
  return false;
}
