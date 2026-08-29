import system from "../../public/system.json";
import { assertGame } from "../functions/isGame";
import { mapObject, systemLogger } from "../functions/utilities";
import { errorMessage } from "../migrations/failures";
import { flaggedMigrations } from "../migrations/flaggedMigrations";
import { getFlaggedMigrations } from "../migrations/getFlaggedMigrations";
import { migrateWorld } from "../migrations/migrateWorld";
import {
  MigrationFlags,
  MigrationFunction,
  MigrationFunctionsForType,
} from "../migrations/types";
import { settings } from "../settings/settings";

/**
 * How many times we let a migration fail on startup before we give up and
 * leave it to the GM to retry by hand. Without this, a migration that fails
 * every time nags the GM with an error notification on every single login.
 */
export const maximumAutomaticMigrationAttempts = 2;

/**
 * The startup task, which determines whether a migration is needed based on
 * migration flags, and then runs it if so.
 *
 * All migrations are idempotent, so a retry re-runs the whole outstanding set
 * over every document. Documents that were already migrated produce an empty
 * update and are skipped, so this costs nothing but a little CPU.
 */
export const migrateWorldIfNeeded = async ({ force = false } = {}) => {
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

  // now we carry on with the main migration logic
  // get the migrations that are flagged as needing to run
  const migrationFlags = settings.migrationFlags.get();
  const [needsMigrationBasedOnFlags, filteredMigrations, newMigrationFlags] =
    getFlaggedMigrations(migrationFlags, flaggedMigrations);

  if (!needsMigrationBasedOnFlags) {
    return;
  }

  // Perform the migration, keeping count of how many times we've tried, so
  // that a permanently broken migration eventually stops nagging the GM.
  const attempts = settings.migrationAttempts.get();
  if (!force && attempts >= maximumAutomaticMigrationAttempts) {
    systemLogger.warn(
      `Skipping ${system.title} system migration after ${attempts} failed attempts. A GM can retry it from GUMSHOE Settings > Misc.`,
    );
    return;
  }

  try {
    await migrateWorld(filteredMigrations);
    await settings.migrationFlags.set(newMigrationFlags);
    await settings.migrationAttempts.set(0);
    await settings.migrationLastError.set("");
  } catch (error) {
    // migrateWorld has already logged and notified; all we do here is count.
    await settings.migrationAttempts.set(attempts + 1);
    await settings.migrationLastError.set(errorMessage(error));
  }
};

/**
 * Run any outstanding migrations regardless of how many times they've already
 * failed. Wired up to a button in the settings dialog.
 */
export const retryFailedMigrations = async () =>
  migrateWorldIfNeeded({ force: true });
