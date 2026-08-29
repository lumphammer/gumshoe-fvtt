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
import {
  ActiveCharacterActor,
  isActiveCharacterActor,
} from "../module/actors/types";
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
): Promise<"add" | "replace"> {
  assertGame(game);
  // the slot may not exist in this world's list - the detail could have come
  // from a compendium built under a different preset, or outlived a preset
  // change that shortened the list - so fall back to the generic type label
  const slotName =
    settings.personalDetails.get()[createData.system?.slotIndex ?? 0]?.name ??
    game.i18n.localize("TYPES.Item.personalDetail");
  const tlMessage = getTranslated("Replace existing {Thing} with {Name}?", {
    Thing:
      createData.system?.slotIndex === occupationSlotIndex
        ? settings.occupationLabel.get()
        : slotName,
    Name: createData.name,
  });
  const result = await DialogV2.wait({
    content: `<p>${tlMessage}</p>`,
    window: {
      title: "Replace or add?",
    },
    buttons: [
      {
        icon: '<i class="fas fa-eraser"></i>',
        label: getTranslated("Replace"),
        action: "replace",
      },
      {
        icon: '<i class="fas fa-plus"></i>',
        label: getTranslated("Add"),
        default: true,
        action: "add",
      },
    ],
  });
  // dismissing the dialog with Escape or the window's X resolves `null`; treat
  // that as "add", which is the default button
  return result === "replace" ? "replace" : "add";
}

async function addPack(
  pack: CompendiumCollection.Any,
  actor: ActiveCharacterActor,
) {
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
        const existingAbility = actor.items.find(
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
    await (actor as any).update({ items });
    ui.notifications?.info(
      `Added or updated ${
        items.length === 1 ? "one item" : `${items.length} items`
      } from "${pack.metadata.label}"`,
    );
  }
}

/**
 * Creation is cancelled in the `preCreateItem` hook while we ask the user what
 * they want, then re-issued from here with this option set, so that the second
 * pass falls straight through instead of asking again.
 */
const alreadyHandled = "investigatorPersonalDetailHandled";

async function resolveThenCreate(
  actor: ActiveCharacterActor,
  source: Item.CreateData,
  createData: PersonalDetailItemCreateData,
  itemsAlreadyInSlot: InvestigatorItem[],
  pack: CompendiumCollection.Any | undefined,
) {
  if (itemsAlreadyInSlot.length > 0) {
    const choice = await askUserAboutAddingOrReplacing(createData);
    if (choice === "replace") {
      await actor.deleteEmbeddedDocuments(
        "Item",
        itemsAlreadyInSlot.map((item) => item.id ?? ""),
      );
    }
  }
  await actor.createEmbeddedDocuments("Item", [source], {
    // fvtt-types only knows about foundry's own operation keys, but anything
    // else in here is passed through to the hooks untouched
    [alreadyHandled]: true,
  } as unknown as Item.Database.CreateOperation);
  if (pack !== undefined) {
    await addPack(pack, actor);
  }
}

export function installPersonalDetailHookHandler() {
  /*
   * quite a chunky hook, but it's doing a few things:
   * 1. see if there's any preexisting personal details in the slot,
   *   and if so, ask the user if they want to replace or add
   * 2. if there's a compendium pack attached, then add the items from it
   *
   * both of those need the user to answer a dialog, so when either applies we
   * cancel the creation, ask, and then create the item ourselves - otherwise
   * the item would already exist by the time the user was asked about it.
   */
  Hooks.on(
    "preCreateItem",
    (
      item: InvestigatorItem,
      createData: Item.CreateData,
      options: Record<string, unknown>,
      userId: string,
    ) => {
      assertGame(game);
      // first off, make sure this is a personal detail, being created inside a
      // pc or npc actor, by the current user
      if (!(
        game.userId === userId &&
        isPersonalDetailItem(item) &&
        isActiveCharacterActor(item.actor) &&
        isPersonalDetailCreateData(createData)
      )) {
        return;
      }
      // this is the creation we re-issued ourselves - everything was settled
      // before it was sent
      if (options[alreadyHandled] === true) {
        return;
      }
      const actor = item.actor;
      // find out what's already in the slot
      const itemsAlreadyInSlot = actor.items.filter(
        (other) =>
          isPersonalDetailItem(other) &&
          other.system.slotIndex === createData.system?.slotIndex,
      );
      const pack = isNullOrEmptyString(createData.system?.compendiumPackId)
        ? undefined
        : game.packs?.find(
            (p) => p.collection === createData.system?.compendiumPackId,
          );
      if (itemsAlreadyInSlot.length === 0 && pack === undefined) {
        return;
      }
      // creation has been cancelled by the time this runs, so a failure here
      // loses the item silently unless we say something
      void resolveThenCreate(
        actor,
        item.toObject(),
        createData,
        itemsAlreadyInSlot,
        pack,
      ).catch((error: unknown) => {
        systemLogger.error("Failed to add personal detail", error);
        ui.notifications?.error(
          `Failed to add "${createData.name}" - see the console for details`,
        );
      });
      // cancel this creation; `resolveThenCreate` will re-issue it once the
      // user has answered
      return false;
    },
  );
}
