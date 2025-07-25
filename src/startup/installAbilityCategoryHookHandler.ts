import { assertGame } from "../functions/isGame";
import { isNullOrEmptyString, systemLogger } from "../functions/utilities";
import { isAbilityItem } from "../module/items/exports";
import { isGeneralAbilityItem } from "../module/items/generalAbility";
import {
  getDefaultGeneralAbilityCategory,
  getDefaultInvestigativeAbilityCategory,
} from "../settings/settings";

export const installAbilityCategoryHookHandler = () => {
  Hooks.on(
    "preCreateItem",
    (item: Item, createData: Item.CreateData, options: any, userId: string) => {
      assertGame(game);
      if (game.userId !== userId) return;

      // ABILITIES
      if (isAbilityItem(item)) {
        const isGeneralAbility = isGeneralAbilityItem(item);
        // set category
        if (isNullOrEmptyString(item.system.categoryId)) {
          const categoryId = isGeneralAbility
            ? getDefaultGeneralAbilityCategory()
            : getDefaultInvestigativeAbilityCategory();
          systemLogger.log(
            `found ability "${createData.name}" with no category, updating to "${categoryId}"`,
          );
          item.updateSource({
            system: { categoryId },
          });
        }
      }
    },
  );
};
