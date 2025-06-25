import { npcIcon, partyIcon, pcIcon } from "../constants";
import { assertGame } from "../functions/isGame";
import { isNullOrEmptyString } from "../functions/utilities";
import { isNPCActor } from "../module/actors/npc";
import { isPartyActor } from "../module/actors/party";
import { isPCActor } from "../module/actors/pc";

export const installActorImageHookHandler = () => {
  Hooks.on(
    "preCreateActor",
    (
      actor: Actor.Implementation,
      createData: Actor.CreateData,
      options: any,
      userId: string,
    ) => {
      assertGame(game);
      if (game.userId !== userId) return;

      // set image
      if (
        isNullOrEmptyString(actor.img) ||
        actor.img === "icons/svg/mystery-man.svg"
      ) {
        actor.updateSource({
          img: isPCActor(actor)
            ? pcIcon
            : isNPCActor(actor)
              ? npcIcon
              : isPartyActor(actor)
                ? partyIcon
                : undefined,
        });
      }
    },
  );
};
