import { InvestigatorItem } from "../module/items/InvestigatorItem";
import { FlaggedMigrations } from "./types";

/**
 * Migrate a single Item entity to incorporate latest data model changes
 * @param item
 */
export const migrateItemData = function (
  item: InvestigatorItem,
  flaggedMigrations: FlaggedMigrations,
): any {
  const updateData = {};
  for (const itemMigration in flaggedMigrations.item) {
    flaggedMigrations.item[itemMigration](item, updateData);
  }
  return updateData;
};
