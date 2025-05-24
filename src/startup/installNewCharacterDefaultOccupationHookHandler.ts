import { occupationSlotIndex } from "../constants";
import { assertGame } from "../functions/utilities";
import { isPCActor } from "../module/actors/pc";
import { InvestigatorActor } from "../module/InvestigatorActor";

export function installNewCharacterDefaultOccupationHookHandler() {
  Hooks.on(
    "createActor",
    async (
      actor: InvestigatorActor,
      options: Record<string, unknown>,
      userId: string,
    ) => {
      assertGame(game);
      if (
        game.userId === userId &&
        isPCActor(actor) &&
        actor.system.getOccupations().length === 0
      ) {
        await actor.system.createPersonalDetail(occupationSlotIndex, false);
      }
    },
  );
}
