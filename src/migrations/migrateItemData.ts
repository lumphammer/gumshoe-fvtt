import { InvestigatorItem } from "../module/items/InvestigatorItem";
import {
  addCategoryToGeneralAbilities,
  setIconForAbilities,
  setTrackersForPreAlpha4Updates,
  upgradeNotesToRichText,
} from "./legacy/itemMigrations";
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
  addCategoryToGeneralAbilities(item, updateData);
  setTrackersForPreAlpha4Updates(item, updateData);
  setIconForAbilities(item, updateData);
  upgradeNotesToRichText(item, updateData);
  for (const itemMigration in flaggedMigrations.item) {
    flaggedMigrations.item[itemMigration](item, updateData);
  }
  return updateData;
};
