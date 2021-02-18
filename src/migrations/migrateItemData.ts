import {
  _addCategoryToGeneralAbilities,
  _setTrackersForPreAlpha4Updates,
} from "./itemMigrations";

/**
 * Migrate a single Item entity to incorporate latest data model changes
 * @param item
 */
export const migrateItemData = function (item: any): any {
  const updateData = {};
  _addCategoryToGeneralAbilities(item, updateData);
  _setTrackersForPreAlpha4Updates(item, updateData);
  return updateData;
};
