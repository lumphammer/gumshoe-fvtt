import system from "../../public/system.json";
import * as constants from "../constants";
import { assertGame, systemLogger } from "../functions/utilities";
import { settings } from "../settings/settings";
import { AnyItem } from "../v10Types";
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
  (ui as any).notifications.info(
    `Applying ${title} System Migration for version ${game.system.version}.
    Please be patient and do not close your game or shut down your server.`,
    { permanent: true },
  );

  // apply flagged world migrations
  for (const worldMigration in flaggedMigrations.world) {
    await flaggedMigrations.world[worldMigration](null, null);
  }

  // Migrate World Actors
  for (const a of game.actors?.contents ?? []) {
    try {
      const updateData = migrateActorData(a, flaggedMigrations);
      if (!foundry.utils.isEmpty(updateData)) {
        await a.update(updateData);
      }
    } catch (err: any) {
      err.message = `Failed ${title} system migration for Actor ${a.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Items
  for (const i of game.items?.contents ?? []) {
    try {
      const updateData = migrateItemData(i, flaggedMigrations);
      if (!foundry.utils.isEmpty(updateData)) {
        console.log(`Migrating Item entity ${i.name}`);
        await i.update(updateData);
      }
    } catch (err: any) {
      err.message = `Failed ${title} system migration for Item ${i.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate Actor Override Tokens
  for (const s of game.scenes?.contents ?? []) {
    try {
      const updateData = migrateSceneData(s, flaggedMigrations);
      if (!foundry.utils.isEmpty(updateData)) {
        console.log(`Migrating Scene entity ${s.name}`);
        await s.update(updateData);
      }
    } catch (err: any) {
      err.message = `Failed {title} system migration for Scene ${s.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Compendium Packs
  // XXX another any
  for (const pack of game.packs as any) {
    systemLogger.log(`Migrating Compendium pack ${pack.metadata.label}`);
    if (pack.metadata.packageType !== "world") continue;
    if (!["Actor", "Item", "Scene"].includes(pack.metadata.type)) continue;
    await migrateCompendium(pack, flaggedMigrations);
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
