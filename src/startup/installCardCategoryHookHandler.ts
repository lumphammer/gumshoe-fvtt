import { assertGame } from "../functions/isGame";
import { isCardItem } from "../module/items/card";
import { settings } from "../settings/settings";
import { CardSystemData } from "../types";

export const installCardCategoryHookHandler = () => {
  Hooks.on(
    "preCreateItem",
    (item: Item, createData: Item.CreateData, options: any, userId: string) => {
      assertGame(game);
      const category = settings.cardCategories.get()[0];
      if (
        game.userId !== userId ||
        category === undefined ||
        !isCardItem(item)
      ) {
        return;
      }

      // set first category
      if (item.system.cardCategoryMemberships.length === 0) {
        const updateData: Pick<
          CardSystemData,
          "cardCategoryMemberships" | "styleKeyCategoryId"
        > = {
          cardCategoryMemberships: [
            {
              categoryId: category.id,
              nonlethal: false,
              worth: 1,
            },
          ],
          styleKeyCategoryId: category.id,
        };
        item.updateSource({ system: updateData });
      }
    },
  );
};
