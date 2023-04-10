import { npc, pc } from "../constants";
import { assertGame } from "../functions";
import { InvestigatorActor } from "../module/InvestigatorActor";
import { settings } from "../settings";

export function installNewCharacterPacksHookHandler() {
  Hooks.on(
    "createActor",
    async (
      actor: InvestigatorActor,
      options: Record<string, unknown>,
      userId: string,
    ) => {
      assertGame(game);
      if (game.userId !== userId) return;

      if (actor.items.size > 0) {
        return;
      }

      if (actor.data.type === pc) {
        // this used to be done in parallel with Promise.all but I was seeing some
        // weird behaviour (duplicated or missing abilities, or weird reference
        // errors) so I have switched it to serial to see if that helps
        for (const packId of settings.newPCPacks.get()) {
          assertGame(game);
          console.log("PACK", packId);
          const content = await game.packs
            ?.find((p: any) => p.collection === packId)
            ?.getDocuments();
          const datas = content?.map((item) => {
            // clunky cast here because there doesn't seem to be a sane way to
            // check the type of something coming out of a compendium pack.
            // XXX if we cast as InvestigatorItem, we have a circular dependency
            const {
              data: { name, img, data, type },
            } = item as any;
            return {
              name,
              img,
              data,
              type,
            };
          });
          console.log("datas", datas);
          await (actor as any).createEmbeddedDocuments("Item", datas);
        }
      }

      if (actor.data.type === npc) {
        for (const packId of settings.newNPCPacks.get()) {
          assertGame(game);
          console.log("PACK", packId);
          const content = await game.packs
            ?.find((p) => p.documentName === "Item" && p.collection === packId)
            ?.getDocuments();
          // XXX eurgh - same as elsewhere - if we cast as InvestigatorItem, we
          // have a circular dependency
          const datas = (content as any[])?.map(
            ({ data: { name, img, data, type } }) => ({
              name,
              img,
              data,
              type,
            }),
          );
          console.log("datas", datas);
          await (actor as any).createEmbeddedDocuments("Item", datas);
        }
      }
    },
  );
}
