import React, { memo, useContext } from "react";

import { openSheet } from "../../../functions/openSheet";
import { mwItem } from "../../../constants";
import { useActorSheetContext } from "../../../hooks/useSheetContexts";
import { ThemeContext } from "../../../themes/ThemeContext";
import type { MwType } from "../../../types";
import { Button } from "../../inputs/Button";
import { Translate } from "../../Translate";

/** An item, as the group shows it */
export type MwItemSummary = { id: string; name: string };

interface MwItemGroupProps {
  /** In order, from the actor's snapshot */
  items: readonly MwItemSummary[];
  name: string;
  mwType: MwType;
  onDragStart: (e: React.DragEvent<HTMLAnchorElement>) => void;
}

export const MwItemGroup = memo(function MwItemGroup({
  items,
  onDragStart,
  name,
  mwType,
}: MwItemGroupProps) {
  "use memo";

  const { actor } = useActorSheetContext();
  const theme = useContext(ThemeContext);
  const openItemSheet = (id: string) => {
    openSheet(actor.items.get(id));
  };

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
        {items.map((item) => (
          <a
            key={item.id}
            css={{
              display: "block",
              position: "relative",
            }}
            onClick={() => openItemSheet(item.id)}
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
});
