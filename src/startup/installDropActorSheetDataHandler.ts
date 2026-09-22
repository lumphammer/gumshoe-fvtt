import { assertGame } from "../functions/isGame";
import { getFolderDescendants } from "../functions/utilities";
import { isPartyActor } from "../module/actors/party";
import { isPCActor } from "../module/actors/pc";

/**
 * This is how we drop actors onto the party sheet.
 */
export const installDropActorSheetDataHandler = () => {
  Hooks.on("dropActorSheetData", (actor, _sheet, data) => {
    assertGame(game);
    if (
      !isPartyActor(actor) ||
      (data.type !== "Actor" &&
        (data.type !== "Folder" || data.documentName !== "Actor")) ||
      !game.user.isGM
    ) {
      return;
    }
    const id =
      "uuid" in data && typeof data["uuid"] === "string"
        ? data["uuid"].replace(/^[\w]+\./, "")
        : undefined;

    if (id === undefined) {
      return;
    }
    const actorIds =
      data.type === "Actor"
        ? [id]
        : getFolderDescendants(game.folders?.get(id))
            .filter((actor) => {
              return isPCActor(actor);
            })
            .map((actor) => (actor as any).id);
    void actor.system.addActorIds(actorIds);
  });
};
