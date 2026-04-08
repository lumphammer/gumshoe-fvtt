import { mapValues } from "../functions/utilities";
import {
  FlaggedMigrations,
  MigrationFlags,
  MigrationFlagsForType,
  MigrationFunctionsForType,
  MigrationTypes,
} from "./types";

/**
 * This is the new migration system, based on flags which indicate when a
 * particular migration has been run.
 */
export function getFlaggedMigrations(
  migrationFlags: MigrationFlags,
  flaggedMigrations: FlaggedMigrations,
) {
  const filteredMigrations = mapValues<
    MigrationFunctionsForType,
    MigrationFunctionsForType,
    MigrationTypes
  >((migrations, type) => {
    const migrationsToRun: MigrationFunctionsForType = {};
    for (const [migrationName, migrationFunction] of Object.entries(
      migrations,
    )) {
      if (!migrationFlags[type][migrationName]) {
        migrationsToRun[migrationName] = migrationFunction;
      }
    }
    return migrationsToRun;
  }, flaggedMigrations);

  const needsMigrationBasedOnFlags =
    Object.values(filteredMigrations).flatMap(Object.values).length > 0;

  const newMigrationFlags = mapValues<
    MigrationFunctionsForType,
    MigrationFlagsForType,
    MigrationTypes
  >((migrations) => {
    return mapValues(() => true, migrations);
  }, flaggedMigrations);

  return [
    needsMigrationBasedOnFlags,
    filteredMigrations,
    newMigrationFlags,
  ] as const;
}
