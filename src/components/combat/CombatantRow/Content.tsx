import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { memo } from "react";

import { assertGame } from "../../../functions/isGame";
import { NativeContextMenuWrapper } from "../../inputs/NativeMenu/NativeContextMenuWrapper";
import { BottomRow } from "./BottomRow";
import { useCombatantContext } from "./CombatantContext";
import { Grip } from "./Grip";
import { TopRow } from "./TopRow";

interface ContentProps {
  setNodeRef: (node: HTMLElement | null) => void;
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  listeners: SyntheticListenerMap | undefined;
}

export const Content = memo(
  ({ setNodeRef, setActivatorNodeRef, listeners }: ContentProps) => {
    assertGame(game);
    const { combatantData } = useCombatantContext();

    return (
      <NativeContextMenuWrapper>
        <>
          <Grip
            listeners={listeners}
            setActivatorNodeRef={setActivatorNodeRef}
          />
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
      </NativeContextMenuWrapper>
    );
  },
);

Content.displayName = "Content";
