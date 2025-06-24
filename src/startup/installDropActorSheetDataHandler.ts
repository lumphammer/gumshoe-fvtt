import { assertGame } from "../functions/isGame";
import { getFolderDescendants } from "../functions/utilities";
import { isPartyActor } from "../module/actors/party";
import { isPCActor } from "../module/actors/pc";

function getIdFromDropData(
  dropData: foundry.appv1.sheets.ActorSheet.DropData,
): string | undefined {
  return "uuid" in dropData && typeof dropData.uuid === "string"
    ? dropData.uuid.replace(/^[\w]+\./, "")
    : undefined;
}

/**
 * This is how we drop actors onto the party sheet.
 */
export const installDropActorSheetDataHandler = () => {
  Hooks.on(
    "dropActorSheetData",
    (
      actor: Actor.Implementation,
      sheet:
        | foundry.appv1.sheets.ActorSheet.Any
        | foundry.applications.sheets.ActorSheetV2.Any,
      data: foundry.appv1.sheets.ActorSheet.DropData,
    ) => {
      assertGame(game);
      if (
        !isPartyActor(actor) ||
        (data.type !== "Actor" &&
          (data.type !== "Folder" || data.documentName !== "Actor")) ||
        !game.user.isGM
      ) {
        return;
      }
      const id = getIdFromDropData(data);
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
    },
  );
};
