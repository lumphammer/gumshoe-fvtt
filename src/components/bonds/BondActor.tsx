import type React from "react";
import { useContext, useState } from "react";

import { openSheet } from "../../functions/openSheet";
import { getTranslated } from "../../functions/getTranslated";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSnapshotSelector } from "../../hooks/useSnapshot";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { InvestigatorActor } from "../../module/actors/InvestigatorActor";
import type { ActiveCharacterActor } from "../../module/actors/types";
import { isActiveCharacterActor } from "../../module/actors/types";
import type { BondItem } from "../../module/items/bond";
import { getWorldActorsStore } from "../../module/snapshots/documentStores";
import { ThemeContext } from "../../themes/ThemeContext";
import { parseFoundryDragData } from "../inputs/parseFoundryDragData";
import { Translate } from "../Translate";

/**
 * Which actors a Bond can be linked to: another character, not a party, and
 * not the Bond's own Agent.
 */
function canLinkTo(
  bond: BondItem,
  actor: unknown,
): actor is ActiveCharacterActor {
  return isActiveCharacterActor(actor) && actor !== bond.actor;
}

/**
 * The name of the actor with this uuid, or null if there isn't one. A world
 * actor's comes from the world's actors' snapshot, so it follows renames and
 * deletions; any other (a token's) from its own snapshot, so it follows
 * renames.
 */
const useActorName = (uuid: string | null): string | null => {
  const worldName = useSnapshotSelector(getWorldActorsStore(), (actors) =>
    uuid === null
      ? null
      : (actors.find((actor) => actor.uuid === uuid)?.name ?? null),
  );
  // (looked up on every render: this hook isn't compiled)
  const other = uuid !== null && worldName === null ? fromUuidSync(uuid) : null;
  const otherName = useActorSnapshot(
    other instanceof InvestigatorActor ? other : null,
    (actor): string | null => actor?.name ?? null,
  );
  return uuid === null ? null : (worldName ?? otherName);
};

/**
 * The actor a Bond is with: drop one here to link it. For a DELTA GREEN Bond
 * that's the teammate (p. 046), so a team crisis strengthens this Bond rather
 * than forming another; for others it might be an NPC. The name opens their
 * sheet.
 */
type BondActorProps = {
  /** only to write through */
  bond: BondItem;
  /** the linked actor's uuid (`system.actorUuid`), if any */
  actorUuid: string | null;
};

export const BondActor = ({ bond, actorUuid }: BondActorProps) => {
  "use memo";

  const theme = useContext(ThemeContext);
  const [isDragOver, setIsDragOver] = useState(false);
  const methods = useSystemMethods(bond);
  const linkedName = useActorName(actorUuid);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    // the sheet would otherwise try to handle it too
    e.stopPropagation();
    setIsDragOver(false);
    const data = parseFoundryDragData(e.dataTransfer.getData("text/plain"));
    const uuid =
      data !== null &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      data["type"] === "Actor" &&
      typeof data["uuid"] === "string"
        ? data["uuid"]
        : null;
    const actor = uuid === null ? null : await fromUuid(uuid);
    if (!canLinkTo(bond, actor)) {
      ui.notifications?.warn(getTranslated("CantLinkBondToThat"));
      return;
    }
    await methods.linkActor(actor);
  };

  return (
    <div
      data-testid="bond-actor"
      onDragOver={onDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
      css={{
        display: "flex",
        alignItems: "center",
        gap: "0.5em",
        minHeight: "1.8em",
        padding: "0 0.5em",
        borderRadius: "0.2em",
        border: `1px dashed ${isDragOver ? theme.colors.accent : theme.colors.controlBorder}`,
        backgroundColor: isDragOver ? theme.colors.backgroundButton : undefined,
      }}
    >
      {actorUuid !== null && linkedName !== null ? (
        <a
          css={{ flex: 1 }}
          onClick={() => {
            const linked = fromUuidSync(actorUuid);
            if (!(linked instanceof Actor)) return;
            openSheet(linked);
          }}
        >
          {linkedName}
        </a>
      ) : (
        <i css={{ flex: 1 }}>
          <Translate>
            {actorUuid ? "Actor not found" : "Drag an actor here"}
          </Translate>
        </i>
      )}
      {actorUuid && (
        <a title={getTranslated("Unlink")} onClick={methods.unlinkActor}>
          <i className="fa fa-unlink" />
        </a>
      )}
    </div>
  );
};

BondActor.displayName = "BondActor";
