import { assertGame } from "../functions/isGame";
import { getFolderDescendants } from "../functions/utilities";
import { InvestigatorActor } from "../module/actors/InvestigatorActor";
import { isPartyActor } from "../module/actors/party";
import { isPCActor } from "../module/actors/pc";

// this isn't the full type for DropData but it's close enough for what we need
interface DropData {
  type: string;
  uuid: string;
  entity?: string;
}

function getIdFromDropData(dropData: DropData): string {
  return dropData.uuid.replace(/^[\w]+\./, "");
}

/**
 * This is how we drop actors onto the party sheet.
 */
export const installDropActorSheetDataHandler = () => {
  Hooks.on(
    "dropActorSheetData",
    (
      targetActor: InvestigatorActor,
      application: Application,
      dropData: DropData,
    ) => {
      assertGame(game);
      if (
        !isPartyActor(targetActor) ||
        (dropData.type !== "Actor" &&
          (dropData.type !== "Folder" || dropData.entity !== "Actor")) ||
        !game.user.isGM
      ) {
        return;
      }
      const id = getIdFromDropData(dropData);
      const actorIds =
        dropData.type === "Actor"
          ? [id]
          : getFolderDescendants(game.folders?.get(id))
              .filter((actor) => {
                return isPCActor(actor);
              })
              .map((actor) => (actor as any).id);
      void targetActor.system.addActorIds(actorIds);
    },
  );
};
