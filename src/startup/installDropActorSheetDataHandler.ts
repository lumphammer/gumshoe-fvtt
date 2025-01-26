import { party, pc } from "../constants";
import { assertGame, getFolderDescendants } from "../functions/utilities";
import { InvestigatorActor } from "../module/InvestigatorActor";

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
        // @ts-expect-error .type
        targetActor.type !== party ||
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
                return (actor as any).type === pc;
              })
              .map((actor) => (actor as any).id);
      void targetActor.addActorIds(actorIds);
    },
  );
};
