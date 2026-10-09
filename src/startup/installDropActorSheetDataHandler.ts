import { assertGame } from "../functions/isGame";
import { isPartyActor } from "../module/actors/party";
import { isPCActor } from "../module/actors/pc";

/** The PCs in a folder, and in the folders inside it. */
function getPCIdsInFolder(folder: Folder) {
  assertGame(game);
  const folderIds = new Set([
    folder.id,
    ...folder.getSubfolders(true).map((f) => f.id),
  ]);
  return game.actors
    .filter((actor) => folderIds.has(actor.folder?.id ?? null))
    .filter((actor) => isPCActor(actor))
    .map((actor) => actor.id ?? "");
}

/**
 * This is how we drop actors onto the party sheet: an actor, or a folder of
 * actors (which adds the PCs in it, and in the folders inside it).
 */
export const installDropActorSheetDataHandler = () => {
  Hooks.on("dropActorSheetData", (actor, _sheet, data) => {
    assertGame(game);
    if (
      !isPartyActor(actor) ||
      !game.user.isGM ||
      !("uuid" in data) ||
      typeof data.uuid !== "string"
    ) {
      return;
    }
    // (only world actors: party members are kept by id)
    const dropped = fromUuidSync(data.uuid);
    const actorIds =
      dropped instanceof Actor && dropped.pack === null
        ? [dropped.id ?? ""]
        : dropped instanceof Folder &&
            dropped.type === "Actor" &&
            dropped.pack === null
          ? getPCIdsInFolder(dropped)
          : [];
    if (actorIds.length === 0) return;
    void actor.system.addActorIds(actorIds);
  });
};
