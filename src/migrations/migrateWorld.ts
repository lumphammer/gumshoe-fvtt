import system from "../../public/system.json";
import * as constants from "../constants";
import { assertGame } from "../functions/isGame";
import { systemLogger } from "../functions/utilities";
import { settings } from "../settings/settings";
import { createFailureCollector, describeDocument } from "./failures";
import { flaggedMigrations } from "./flaggedMigrations";
import { migrateActorData } from "./migrateActorData";
import { migrateCompendium } from "./migrateCompendium";
import { migrateItemData } from "./migrateItemData";
import { migrateSceneData } from "./migrateSceneData";
import { FlaggedMigrations } from "./types";

const title = system.title;

/**
 * Perform a system migration for the entire World, applying migrations for
 * Actors, Items, and Compendium packs
 * @return {Promise}      A Promise which resolves once the migration is completed
 */
export const migrateWorld = async function (
  flaggedMigrations: FlaggedMigrations,
) {
  assertGame(game);
  const { failures, record: recordFailure } = createFailureCollector();

  (ui as any).notifications.info(
    `Applying ${title} System Migration for version ${game.system.version}.
    Please be patient and do not close your game or shut down your server.`,
    { permanent: true },
  );

  // apply flagged world migrations
  for (const worldMigration in flaggedMigrations.world) {
    try {
      await flaggedMigrations.world[worldMigration](null, null);
    } catch (error) {
      recordFailure(`world migration ${worldMigration}`, error);
    }
  }

  // Migrate World Actors
  for (const actor of game.actors?.contents ?? []) {
    try {
      const updateData = migrateActorData(actor, flaggedMigrations);
      if (!foundry.utils.isEmpty(updateData)) {
        await actor.update(updateData);
      }
    } catch (error) {
      recordFailure(`Actor ${describeDocument(actor)}`, error);
    }
  }

  // Migrate World Items
  for (const item of game.items?.contents ?? []) {
    try {
      const updateData = migrateItemData(item, flaggedMigrations);
      if (!foundry.utils.isEmpty(updateData)) {
        systemLogger.log(`Migrating Item entity ${item.name}`);
        await item.update(updateData);
      }
    } catch (error) {
      recordFailure(`Item ${describeDocument(item)}`, error);
    }
  }

  // Migrate Actor Override Tokens
  for (const s of game.scenes?.contents ?? []) {
    try {
      const updateData = migrateSceneData(s, flaggedMigrations);
      if (!foundry.utils.isEmpty(updateData)) {
        systemLogger.log(`Migrating Scene entity ${s.name}`);
        await s.update(updateData);
      }
    } catch (error) {
      recordFailure(`Scene ${describeDocument(s)}`, error);
    }
  }

  // Migrate compendium packs
  for (const pack of game.packs) {
    systemLogger.log(`Migrating Compendium pack ${pack.metadata.label}`);
    if (pack.locked) continue;
    if (!["Actor", "Item", "Scene"].includes(pack.metadata.type)) continue;
    try {
      await migrateCompendium(pack, flaggedMigrations);
    } catch (error) {
      recordFailure(`Compendium ${pack.collection}`, error);
    }
  }

  if (failures.length > 0) {
    const error = new Error(
      `${title} system migration failed for ${failures.length} target${
        failures.length === 1 ? "" : "s"
      }: ${failures.join("; ")}`,
    );
    ui.notifications?.error(error.message, { permanent: true });
    throw error;
  }

  // Set the migration as complete
  await settings.systemMigrationVersion.set(system.version);
  ui.notifications?.info(
    `${system.title} system migration to version ${system.version} completed!`,
    { permanent: true },
  );
};

(window as any).migrateSystemCompendiums = async () => {
  assertGame(game);
  for (const p of game.packs as any) {
    if (p.metadata.packageName !== constants.systemId) continue;
    if (!["Actor", "Item", "Scene"].includes(p.metadata.type)) continue;
    await migrateCompendium(p, flaggedMigrations);
  }
};
