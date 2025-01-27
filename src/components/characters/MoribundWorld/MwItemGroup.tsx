import React, { useContext } from "react";

import { mwItem } from "../../../constants";
import { sortEntitiesByName } from "../../../functions/utilities";
import { useActorSheetContext } from "../../../hooks/useSheetContexts";
import { ThemeContext } from "../../../themes/ThemeContext";
import { MwType } from "../../../types";
import { Button } from "../../inputs/Button";
import { Translate } from "../../Translate";

interface MwItemGroupProps {
  items: Item[];
  name: string;
  mwType: MwType;
  onDragStart: (e: React.DragEvent<HTMLAnchorElement>) => void;
}

export const MwItemGroup = ({
  items,
  onDragStart,
  name,
  mwType,
}: MwItemGroupProps) => {
  const { actor } = useActorSheetContext();
  const theme = useContext(ThemeContext);
  return (
    <div
      css={{
        marginBottom: "0.5em",
        paddingBottom: "0.5em",
        borderBottom: `1px solid ${theme.colors.controlBorder}`,
      }}
    >
      <div>
        <h1
          css={{
            display: "inline",
          }}
        >
          <Translate>{name}</Translate>
        </h1>
        <Button
          css={{
            float: "right",
            width: "auto",
          }}
          onClick={async () => {
            await actor.createEmbeddedDocuments(
              "Item",
              [
                {
                  // @ts-expect-error .type
                  type: mwItem,
                  name: "New item",
                  system: {
                    mwType,
                  },
                },
              ],
              {
                renderSheet: true,
              },
            );
          }}
        >
          <i className="fa fa-plus" />
          <Translate>Add Item</Translate>
        </Button>
      </div>
      {items.length === 0 && (
        <i
          css={{
            display: "block",
            fontSize: "1.2em",
          }}
        >
          <Translate>No items yet.</Translate>
        </i>
      )}

      <div
        css={{
          columns: "auto 12em",
        }}
      >
        {sortEntitiesByName(items).map((item) => (
          <a
            key={item.id}
            css={{
              display: "block",
              position: "relative",
            }}
            onClick={() => item.sheet?.render(true)}
            data-item-id={item.id}
            onDragStart={onDragStart}
            draggable="true"
          >
            {item.name}
          </a>
        ))}
      </div>
    </div>
  );
};
