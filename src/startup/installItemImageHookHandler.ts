import {
  cardIcon,
  equipmentIcon,
  generalAbilityIcon,
  investigativeAbilityIcon,
  personalDetailIcon,
  weaponIcon,
} from "../constants";
import { assertGame } from "../functions/isGame";
import { isNullOrEmptyString } from "../functions/utilities";
import { isCardItem } from "../module/items/card";
import { isEquipmentItem } from "../module/items/equipment";
import { isGeneralAbilityItem } from "../module/items/generalAbility";
import { isPersonalDetailItem } from "../module/items/personalDetail";
import { isWeaponItem } from "../module/items/weapon";

export const installItemImageHookHandler = () => {
  Hooks.on(
    "preCreateItem",
    (
      item: Item,
      createData: { name: string; type: string; img?: string },
      options: any,
      userId: string,
    ) => {
      assertGame(game);
      if (game.userId !== userId) return;

      // set image
      if (
        isNullOrEmptyString(item.img) ||
        item.img === "icons/svg/item-bag.svg"
      ) {
        item.updateSource({
          img: isWeaponItem(item)
            ? weaponIcon
            : isEquipmentItem(item)
              ? equipmentIcon
              : isGeneralAbilityItem(item)
                ? generalAbilityIcon
                : isPersonalDetailItem(item)
                  ? personalDetailIcon
                  : isCardItem(item)
                    ? cardIcon
                    : investigativeAbilityIcon,
        });
      }
    },
  );
};
