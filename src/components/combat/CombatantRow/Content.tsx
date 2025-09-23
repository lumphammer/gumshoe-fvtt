import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { memo } from "react";

import { assertGame } from "../../../functions/isGame";
import { BottomRow } from "./BottomRow";
import { useCombatantContext } from "./CombatantContext";
import { Grip } from "./Grip";
import { TopRow } from "./TopRow";

interface ContentProps {
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  listeners: SyntheticListenerMap | undefined;
}

export const Content = memo(
  ({ setActivatorNodeRef, listeners }: ContentProps) => {
    assertGame(game);
    const { combatantData } = useCombatantContext();

    return (
      <>
        <Grip listeners={listeners} setActivatorNodeRef={setActivatorNodeRef} />
        <img
          className="token-image"
          src={combatantData.img || CONST.DEFAULT_TOKEN}
          alt={combatantData.name}
          loading="lazy"
        />
        <div
          css={{
            overflow: "hidden",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-evenly",
            alignSelf: "stretch",
          }}
        >
          <TopRow />
          <BottomRow />
        </div>
      </>
    );
  },
);

Content.displayName = "Content";
