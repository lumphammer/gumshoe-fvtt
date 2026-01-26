import {
  generalAbility,
  investigativeAbility,
  occupationSlotIndex,
  personalDetail,
} from "../constants";
import { confirmADoodleDo } from "../functions/confirmADoodleDo";
import { getTranslated } from "../functions/getTranslated";
import { assertGame } from "../functions/isGame";
import { isNullOrEmptyString, systemLogger } from "../functions/utilities";
import { CompendiumCollection, CreateData, DialogV2 } from "../fvtt-exports";
import { isActiveCharacterActor } from "../module/actors/types";
import { InvestigatorItem } from "../module/items/InvestigatorItem";
import {
  isPersonalDetailItem,
  personalDetailSchema,
} from "../module/items/personalDetail";
import { settings } from "../settings/settings";

type PersonalDetailItemCreateData = {
  name: string;
  system?: CreateData<typeof personalDetailSchema>;
};

// type predicate to assert the
function isPersonalDetailCreateData(x: any): x is PersonalDetailItemCreateData {
  return x && "type" in x && x.type === personalDetail;
}

async function askUserAboutAddingOrReplacing(
  createData: PersonalDetailItemCreateData,
  itemsAlreadyInSlot: InvestigatorItem[],
) {
  const tlMessage = getTranslated("Replace existing {Thing} with {Name}?", {
    Thing:
      createData.system?.slotIndex === occupationSlotIndex
        ? settings.occupationLabel.get()
        : settings.personalDetails.get()[createData.system?.slotIndex ?? 0]
            .name,
    Name: createData.name,
  });
  const replaceText = getTranslated("Replace");
  const addText = getTranslated("Add");
  const promise = new Promise<boolean>((resolve) => {
    const onAdd = () => {
      resolve(true);
    };
    const onReplace = async () => {
      const itemIds = itemsAlreadyInSlot?.map((item) => item.id ?? "") ?? [];

      await itemsAlreadyInSlot?.[0].actor?.deleteEmbeddedDocuments(
        "Item",
        itemIds,
      );
      resolve(true);
    };

    const dialog = new DialogV2({
      content: `<p>${tlMessage}</p>`,
      window: {
        title: "Replace or add?",
      },
      buttons: [
        {
          icon: '<i class="fas fa-eraser"></i>',
          label: replaceText,
          callback: onReplace,
          action: "replace",
        },
        {
          icon: '<i class="fas fa-plus"></i>',
          label: addText,
          callback: onAdd,
          default: true,
          action: "add",
        },
      ],
    });
    void dialog.render({ force: true });
    return false;
  });
  await promise;
}

async function addPack(pack: CompendiumCollection.Any, item: InvestigatorItem) {
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
          (actorItem: Item) =>
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
                (existingAbility.system.rating ?? 0) + packItem.system.rating,
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
    systemLogger.log("items", items);
    await (item.actor as any).update({ items });
    ui.notifications?.info(
      `Added or updated ${
        items.length === 1 ? "one item" : `${items.length} items`
      } from "${pack.metadata.label}"`,
    );
  }
}

async function doPersonalDetailStuff(
  item: InvestigatorItem,
  createData: Item.CreateData,
  userId: string,
) {
  assertGame(game);
  // first off, make sure this is a personal detail, being created inside a
  // pc or npc actor, by the current user
  if (
    !(
      game.userId === userId &&
      isPersonalDetailItem(item) &&
      isActiveCharacterActor(item.actor) &&
      item.actor &&
      isPersonalDetailCreateData(createData)
    )
  ) {
    return;
  }
  // find out what's already in the slot
  const itemsAlreadyInSlot = item.actor?.items.filter(
    (item) =>
      isPersonalDetailItem(item) &&
      item.system.slotIndex === createData.system?.slotIndex,
  );
  // if anything, ask the user if they want to replace or add
  if ((itemsAlreadyInSlot?.length ?? 0) > 0) {
    await askUserAboutAddingOrReplacing(createData, itemsAlreadyInSlot);
  }

  // add compendium pack stuff, if any
  if (!isNullOrEmptyString(createData.system?.compendiumPackId)) {
    const pack = game.packs?.find(
      (p) => p.collection === createData.system?.compendiumPackId,
    );

    if (pack) {
      await addPack(pack, item);
    }
  }
}

export function installPersonalDetailHookHandler() {
  /*
   * quite a chunky hook, but it's doing a few things:
   * 1. see if there's any preexisting personal details in the slot,
   *   and if so, ask the user if they want to replace or add
   * 2. if there's a compendium pack attached, then add the items from it
   *
   */
  // document: InvestigatorItem<"base" | Document.ModuleSubType | "equipment" | "generalAbility" | "investigativeAbility" | "weapon" | "mwItem" | "personalDetail" | "card">,
  // data: Item.CreateData,
  // options: Document.Database.PreCreateOptions<DatabaseCreateOperation>,

  Hooks.on(
    "preCreateItem",
    (
      item: InvestigatorItem,
      createData: Item.CreateData,
      options: unknown,
      userId: string,
    ) => {
      void doPersonalDetailStuff(item, createData, userId);
    },
  );
}
