import {
  equipmentIcon,
  generalAbilityIcon,
  investigativeAbilityIcon,
  personalDetailIcon,
  weaponIcon,
} from "../constants";
import { assertGame, isNullOrEmptyString } from "../functions/utilities";
import {
  isEquipmentItem,
  isGeneralAbilityItem,
  isPersonalDetailItem,
  isWeaponItem,
} from "../v10Types";

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
        // @ts-expect-error v10 types
        item.updateSource({
          img: isWeaponItem(item)
            ? weaponIcon
            : isEquipmentItem(item)
              ? equipmentIcon
              : isGeneralAbilityItem(item)
                ? generalAbilityIcon
                : isPersonalDetailItem(item)
                  ? personalDetailIcon
                  : investigativeAbilityIcon,
        });
      }
    },
  );
};
