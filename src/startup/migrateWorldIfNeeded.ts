import system from "../../public/system.json";
import { assertGame, mapObject, systemLogger } from "../functions/utilities";
import { flaggedMigrations } from "../migrations/flaggedMigrations";
import { getFlaggedMigrations } from "../migrations/getFlaggedMigrations";
import { getNeedsMigrationBasedOnLegacyVersionSystem } from "../migrations/legacy/getNeedsMigrationBasedOnLegacyVersionSystem";
import { migrateWorld } from "../migrations/migrateWorld";
import {
  MigrationFlags,
  MigrationFunction,
  MigrationFunctionsForType,
} from "../migrations/types";
import { settings } from "../settings/settings";

/**
 * The startup task, which determines whether a migration is needed (using
 * either the legacy system or the new system) and then runs it.
 */
export const migrateWorldIfNeeded = async () => {
  assertGame(game);

  if (!game.user.isGM) {
    return;
  }
  // first, we do some work to see if this is the first run of a new world,
  let firstRun = settings.firstRun.get();
  if (firstRun) {
    // if there are any actors, scenes, or items, then this isn't the first run
    // it's probably someone upgrading from a previous version from before we
    // had this logic here
    firstRun =
      game.actors?.size === 0 &&
      game.scenes?.size === 0 &&
      game.items?.size === 0;
    if (!firstRun) {
      systemLogger.log("Detected a non-first run - setting firstRun to false");
      await settings.firstRun.set(false);
    }
  }
  // if we *still* think it's a first run, we "pre-flag" all migrations
  // so we avoid running them all on the first run
  if (firstRun) {
    systemLogger.log("Detected a first run - pre-flagging all migrations");
    // map flaggedMigrations to booleans
    const newMigrationFlags = mapObject<
      MigrationFunctionsForType,
      Record<string, boolean>
    >((migrations) =>
      mapObject<MigrationFunction, boolean>(() => true)(migrations),
    )(flaggedMigrations) as MigrationFlags;
    // set the migration flags to the new flags
    await settings.migrationFlags.set(newMigrationFlags);
    await settings.firstRun.set(false);
    await settings.systemMigrationVersion.set(system.version);
  }

  // now we carry on with the main migration logics
  // get the migrations that are flagged as needing to run
  const migrationFlags = settings.migrationFlags.get();
  const [needsMigrationBasedOnFlags, filteredMigrations, newMigrationFlags] =
    getFlaggedMigrations(migrationFlags, flaggedMigrations);

  // Perform the migration
  if (
    getNeedsMigrationBasedOnLegacyVersionSystem() ||
    needsMigrationBasedOnFlags
  ) {
    await migrateWorld(filteredMigrations);
    await settings.migrationFlags.set(newMigrationFlags);
  }
};
