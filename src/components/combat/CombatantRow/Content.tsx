import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { memo } from "react";

import { assertGame } from "../../../functions/isGame";
import { BottomRow } from "./BottomRow";
import { useCombatantContext } from "./CombatantContext";
import { Grip } from "./Grip";
import { TopRow } from "./TopRow";
import { css } from "../../../styled-system/css";
import type { DraggableAttributes } from "@dnd-kit/core";

interface ContentProps {
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  listeners: SyntheticListenerMap | undefined;
  /** dnd-kit's (role, tab stop, description), for the grip */
  attributes: DraggableAttributes;
}

export const Content = memo(
  ({ setActivatorNodeRef, listeners, attributes }: ContentProps) => {
    assertGame(game);
    const { combatantState } = useCombatantContext();

    return (
      <>
        {combatantState.type === "classic" && game.user.isGM && (
          <Grip
            listeners={listeners}
            attributes={attributes}
            setActivatorNodeRef={setActivatorNodeRef}
          />
        )}
        <img
          className="token-image"
          src={combatantState.img || CONST.DEFAULT_TOKEN}
          alt={combatantState.name}
          loading="lazy"
        />
        <div
          className={css({
            overflow: "hidden",
            flex: "[1]",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-evenly",
            alignSelf: "stretch",
          })}
        >
          <TopRow />
          <BottomRow />
        </div>
      </>
    );
  },
);

Content.displayName = "Content";
