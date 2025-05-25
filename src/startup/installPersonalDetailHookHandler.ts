import {
  generalAbility,
  investigativeAbility,
  occupationSlotIndex,
  personalDetail,
} from "../constants";
import { confirmADoodleDo } from "../functions/confirmADoodleDo";
import { getTranslated } from "../functions/getTranslated";
import { assertGame, isNullOrEmptyString } from "../functions/utilities";
import { isActiveCharacterActor } from "../module/actors/exports";
import { isPersonalDetailItem } from "../module/items/personalDetail";
import { settings } from "../settings/settings";

export function installPersonalDetailHookHandler() {
  /*
   * quite a chunky hook, but it's doing a few things:
   * 1. see if there's any preexisting personal details in the slot,
   *   and if so, ask the user if they want to replace or add
   * 2. if there's a compendium pack attached, then add the items from it
   *
   */
  Hooks.on(
    "preCreateItem",
    async (
      item: Item,
      createData: { name: string; type: string; system?: any; img?: string },
      options: any,
      userId: string,
    ) => {
      assertGame(game);
      // first off, make sure this is a personal detail, being created inside a
      // pc or npc actor, by the current user
      if (
        !(
          game.userId === userId &&
          item.type === personalDetail &&
          item.isEmbedded &&
          item.actor &&
          isActiveCharacterActor(item.actor)
        )
      ) {
        return;
      }
      // find out what's already in the slot
      const itemsAlreadyInSlot = item.actor?.items.filter(
        (item) =>
          isPersonalDetailItem(item) &&
          item.system.slotIndex === createData.system.slotIndex,
      );
      const existingCount = itemsAlreadyInSlot?.length ?? 0;
      // if anything, ask the user if they want to replace or add
      if (existingCount > 0) {
        const tlMessage = getTranslated(
          "Replace existing {Thing} with {Name}?",
          {
            Thing:
              createData.system.slotIndex === occupationSlotIndex
                ? settings.occupationLabel.get()
                : settings.shortNotes.get()[createData.system.slotIndex],
            Name: createData.name,
          },
        );
        const replaceText = getTranslated("Replace");
        const addText = getTranslated("Add");
        const promise = new Promise<boolean>((resolve) => {
          const onAdd = () => {
            resolve(true);
          };
          const onReplace = async () => {
            const itemIds =
              itemsAlreadyInSlot?.map((item) => item.id ?? "") ?? [];

            await itemsAlreadyInSlot?.[0].actor?.deleteEmbeddedDocuments(
              "Item",
              itemIds,
            );
            resolve(true);
          };

          const d = new Dialog({
            title: "Replace or add?",
            content: `<p>${tlMessage}</p>`,
            buttons: {
              replace: {
                icon: '<i class="fas fa-eraser"></i>',
                label: replaceText,
                callback: onReplace,
              },
              add: {
                icon: '<i class="fas fa-plus"></i>',
                label: addText,
                callback: onAdd,
              },
            },
            default: "cancel",
          });
          d.render(true);
          return false;
        });
        await promise;
      }

      // add compendium pack stuff, if any
      if (!isNullOrEmptyString(createData.system?.compendiumPackId)) {
        const pack = game.packs?.find(
          (p) => p.collection === createData.system?.compendiumPackId,
        );

        if (pack) {
          const shouldAdd = await confirmADoodleDo({
            message: "Add all items from pack {Name}?",
            cancelText: getTranslated("Cancel"),
            confirmText: getTranslated("Add"),
            confirmIconClass: "fas fa-plus",
            values: {
              Name: pack.metadata.label, //
            },
          });

          if (shouldAdd) {
            const content = await pack.getDocuments();
            // casting to any here because it's easier and more futureproof to
            // work with `.system` than `.data.data`.
            const items = content?.map((packItem: any) => {
              if (
                packItem.type === generalAbility ||
                packItem.type === investigativeAbility
              ) {
                const existingAbility = item.actor?.items.find(
                  (actorItem) =>
                    actorItem.type === packItem.type &&
                    actorItem.name === packItem.name,
                ) as any;
                if (existingAbility) {
                  const payload = {
                    _id: existingAbility.id,
                    type: existingAbility.type,
                    name: existingAbility.name,
                    img: existingAbility.img,
                    system: {
                      ...existingAbility.system,
                      rating:
                        (existingAbility.system.rating ?? 0) +
                        packItem.system.rating,
                    },
                  };
                  return payload;
                }
              }
              return {
                name: packItem.name,
                type: packItem.type,
                img: packItem.img,
                system: packItem.system,
              };
            });
            console.log("items", items);
            await (item.actor as any).update({ items });
            ui.notifications?.info(
              `Added or updated ${
                items.length === 1 ? "one item" : `${items.length} items`
              } from "${pack.metadata.label}"`,
            );
          }
        }
      }
    },
  );
}
