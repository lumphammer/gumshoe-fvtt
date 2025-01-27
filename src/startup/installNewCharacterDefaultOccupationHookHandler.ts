import { occupationSlotIndex, pc } from "../constants";
import { assertGame } from "../functions/utilities";
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
        // @ts-expect-error .type
        actor.type === pc &&
        actor.getOccupations().length === 0
      ) {
        await actor.createPersonalDetail(occupationSlotIndex, false);
      }
    },
  );
}
