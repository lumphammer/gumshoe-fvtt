import { getTranslated } from "../functions/getTranslated";
import { assertGame } from "../functions/utilities";
import { isPCActor } from "../module/actors/pc";
import { settings } from "../settings/settings";

// /src/foundry/common/data/data.mjs/chatMessageData.d.ts
export function installEquipmentAddedNotifier() {
  Hooks.on("createItem", async (item: Item, opts: unknown, userId: string) => {
    assertGame(game);
    const isNotOwned = !item.parent && isPCActor(item.parent);
    const gameHasNoUsers = !game.users;
    const notMyFault = game.userId !== userId;
    const settingsOff = !settings.notifyItemAddedToActor.get();

    if (isNotOwned || gameHasNoUsers || notMyFault || settingsOff) {
      return;
    }

    const recipientIds = (game.users ?? [])
      .filter((user) => {
        const hasPermission = item.testUserPermission(
          user,
          CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
          { exact: false },
        );
        const isNotMe = user.id !== game.user.id;
        return hasPermission && isNotMe;
      })
      .map((user) => user.id);

    const proms = recipientIds.map((recipientId) => {
      return ChatMessage.create(
        {
          author: game.user.id,
          speaker: ChatMessage.getSpeaker({
            alias: game.user.name,
          }),
          content: getTranslated("ItemNameAddedToActorName", {
            ItemName: item.name,
            ActorName: item.parent?.name ?? "",
          }),
          whisper: [recipientId],
        },
        {},
      );
    });

    await Promise.all(proms);
  });
}
