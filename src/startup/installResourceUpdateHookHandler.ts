import { assertGame } from "../functions/isGame";
import { UpdateData } from "../fvtt-exports";
import { isActiveCharacterActor } from "../module/actors/exports";
import {
  assertGeneralAbilityItem,
  GeneralAbilityItem,
  isGeneralAbilityItem,
} from "../module/items/generalAbility";
import { InvestigatorItem } from "../module/items/InvestigatorItem";
import { createActiveCharacterSchema } from "../module/schemaFields";

// previously these were the only four resource attributes in the system.
// for legacy compatibility (e.g. if people have content in compendium packs
// that doesn't get migrated) we need to support these names.
const legacyResourceNames = ["health", "sanity", "stability", "magic"];

function getResourceName(item: GeneralAbilityItem): string | null {
  if (item.system.linkToResource) {
    return item.system.resourceId;
  }

  const normalisedName = item.name.trim().toLowerCase();
  if (legacyResourceNames.includes(normalisedName)) {
    return normalisedName;
  }

  return null;
}

/**
 * Install the hook handlers for resource update events.
 */
export function installResourceUpdateHookHandler() {
  /*
   * When a general ability updates, update the corresponding resource on the
   * actor.
   */
  Hooks.on(
    "updateItem",
    (
      item: InvestigatorItem,
      diff: any,
      options: Record<string, unknown>,
      userId: string,
    ) => {
      assertGame(game);

      if (
        // Ensure the hook was triggered by the current user
        game.userId !== userId ||
        // Ensure the item is associated with an actor
        !item.actor ||
        // Ensure the item is a general ability item
        !isGeneralAbilityItem(item) ||
        // Ensure either the pool or the rating has been updated
        (diff.system?.pool === undefined && diff.system?.rating === undefined)
      ) {
        return;
      }

      const resourceName = getResourceName(item);

      if (resourceName === null) {
        return;
      }

      // All conditions met, update the actor's resource
      void item.actor.update({
        system: {
          resources: {
            [resourceName]: {
              min: item.system.min,
              value: item.system.pool,
              max: item.system.rating,
            },
          },
        },
      });
    },
  );

  /*
   * When an actor updates a resource attribute, update any corresponding
   * general abilities.
   *
   * This does not work for legacy resource names because it never used to
   * (this was an oversight but no need to add for legacy compatibility).
   */
  Hooks.on("updateActor", (actor, diff, options, userId) => {
    assertGame(game);
    if (
      // ensure the update is triggered by the current user
      game.userId !== userId ||
      // the actor is an active character (PC or NPC)
      !isActiveCharacterActor(actor) ||
      // a resource update is present
      !diff.system ||
      !("resources" in diff.system)
      // !diff.system?.resources
    ) {
      return;
    }

    // i need to convince TS that diff.system is of the right type
    const systemDiff = diff.system as UpdateData<
      ReturnType<typeof createActiveCharacterSchema>
    >;
    // get the resource entries that have been updated
    const entries = Object.entries(systemDiff.resources || {});

    // for each resource entry, update the corresponding general abilities
    for (const [resourceId, resource] of entries) {
      // get the general abilities that are linked to the resource
      const abilities = actor.items.filter((item) => {
        return (
          isGeneralAbilityItem(item) &&
          item.system.linkToResource &&
          item.system.resourceId === resourceId
        );
      });

      // for each general ability, update the pool value
      abilities?.forEach((ability) => {
        assertGeneralAbilityItem(ability);
        const newValue = resource?.value;
        if (newValue === undefined || newValue === null) {
          return;
        }
        const cappedValue = Math.max(
          Math.min(newValue, ability.system.rating),
          ability.system.min,
        );
        void ability.update({
          system: {
            pool: cappedValue,
          },
        });
      });
    }
  });

  /*
   * When a general ability is added to an actor, create the corresponding
   * resource attribute on the actor.
   */
  Hooks.on(
    "createItem",
    (item: InvestigatorItem, options: any, userId: string) => {
      if (
        // ensure the update is triggered by the current user
        game.userId !== userId ||
        // ensure the item is a general ability item
        !isGeneralAbilityItem(item) ||
        // ensure the item has a parent
        !item.parent
      ) {
        return;
      }

      const resourceName = getResourceName(item);

      if (resourceName === null) {
        return;
      }

      // create the resource attribute on the actor
      void item.parent.update({
        system: {
          resources: {
            [resourceName]: {
              min: item.system.min,
              value: item.system.pool,
              max: item.system.rating,
            },
          },
        },
      });
    },
  );
}
