import { assertGame } from "../functions/utilities";
import { settings } from "../settings/settings";
import { CardSystemData } from "../types";
import { isCardItem } from "../v10Types";

export const installCardCategoryHookHandler = () => {
  Hooks.on(
    "preCreateItem",
    (
      item: Item,
      createData: { name: string; type: string; data?: any; img?: string },
      options: any,
      userId: string,
    ) => {
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
