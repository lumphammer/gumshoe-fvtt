import { assertGame } from "../functions/isGame";
import {
  EquipmentSystemData,
  isEquipmentItem,
} from "../module/items/equipment";
import { settings } from "../settings/settings";
import { applyEquipmentFieldDefaults } from "./applyEquipmentFieldDefaults";

export const installEquipmentCategoryHookHandler = () => {
  Hooks.on(
    "preCreateItem",
    (item: Item, createData: Item.CreateData, options: any, userId: string) => {
      assertGame(game);
      if (game.userId !== userId) return;

      // set category and fields
      if (isEquipmentItem(item)) {
        const equipmentCategories = settings.equipmentCategories.get();
        const categoryId =
          item.system.categoryId || Object.keys(equipmentCategories)[0];
        // the category may not resolve - the item could have come from another
        // world, or its category could have been deleted since. leave the id
        // alone in that case rather than reassigning it: the sheet already
        // collects these under "Uncategorized", and keeping the original id
        // means the item snaps back into place if the category returns
        const fieldDefinitions = equipmentCategories[categoryId]?.fields ?? {};
        const updateData: Pick<EquipmentSystemData, "categoryId" | "fields"> = {
          categoryId,
          fields: applyEquipmentFieldDefaults(
            item.system.fields || {},
            fieldDefinitions,
          ),
        };
        item.updateSource({ system: updateData });
      }
    },
  );
};
