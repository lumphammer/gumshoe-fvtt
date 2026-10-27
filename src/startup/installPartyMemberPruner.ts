import { assertGame } from "../functions/isGame";
import { isPartyActor } from "../module/actors/party";

/**
 * Remove deleted actors from every party. The active GM does it, because the
 * user who deleted the actor may not be able to write to the party. Actors
 * deleted while no GM was around are caught when a GM next loads the world.
 */
export const installPartyMemberPruner = () => {
  const pruneParties = (deletedId?: string) => {
    assertGame(game);
    if (!game.user.isActiveGM) return;
    for (const actor of game.actors) {
      if (
        isPartyActor(actor) &&
        (deletedId === undefined || actor.system.actorIds.includes(deletedId))
      ) {
        void actor.system.removeMissingActorIds();
      }
    }
  };

  Hooks.once("ready", () => pruneParties());
  Hooks.on("deleteActor", (actor) => pruneParties(actor.id ?? ""));
};
