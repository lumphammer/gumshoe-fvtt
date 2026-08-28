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
        const updateData: Pick<EquipmentSystemData, "categoryId" | "fields"> = {
          categoryId: item.system.categoryId || categoryId,
          fields: item.system.fields || {},
        };
        updateData.fields = applyEquipmentFieldDefaults(
          updateData.fields,
          equipmentCategories[categoryId].fields,
        );
        item.updateSource({ system: updateData });
      }
    },
  );
};
