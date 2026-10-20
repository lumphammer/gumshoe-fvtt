import type React from "react";
import { useContext, useState } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { getTranslated } from "../../functions/getTranslated";
import type { ActiveCharacterActor } from "../../module/actors/types";
import { isActiveCharacterActor } from "../../module/actors/types";
import type { BondItem } from "../../module/items/bond";
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
 * The actor a Bond is with: drop one here to link it. For a DELTA GREEN Bond
 * that's the teammate (p. 046), so a team crisis strengthens this Bond rather
 * than forming another; for others it might be an NPC. The name opens their
 * sheet.
 */
export const BondActor = ({ bond }: { bond: BondItem }) => {
  const theme = useContext(ThemeContext);
  const [isDragOver, setIsDragOver] = useState(false);
  const linked = bond.system.linkedActor;

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
    await bond.system.linkActor(actor);
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
      {linked ? (
        <a
          css={{ flex: 1 }}
          onClick={() => {
            const sheet = linked.sheet;
            assertApplicationV2(sheet);
            void sheet.render({ force: true });
          }}
        >
          {linked.name}
        </a>
      ) : (
        <i css={{ flex: 1 }}>
          <Translate>
            {bond.system.actorUuid ? "Actor not found" : "Drag an actor here"}
          </Translate>
        </i>
      )}
      {bond.system.actorUuid && (
        <a title={getTranslated("Unlink")} onClick={bond.system.unlinkActor}>
          <i className="fa fa-unlink" />
        </a>
      )}
    </div>
  );
};

BondActor.displayName = "BondActor";
