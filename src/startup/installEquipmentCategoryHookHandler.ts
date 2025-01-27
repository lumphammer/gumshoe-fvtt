import { assertGame } from "../functions/utilities";
import { settings } from "../settings/settings";
import { EquipmentSystemData } from "../types";
import { isEquipmentItem } from "../v10Types";

export const installEquipmentCategoryHookHandler = () => {
  Hooks.on(
    "preCreateItem",
    (
      item: Item,
      createData: { name: string; type: string; data?: any; img?: string },
      options: any,
      userId: string,
    ) => {
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
        const fields = equipmentCategories[categoryId].fields;
        for (const field in fields) {
          updateData.fields[field] ||= fields[field].default;
        }
        item.updateSource({ system: updateData });
      }
    },
  );
};
