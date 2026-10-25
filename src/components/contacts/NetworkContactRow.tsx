import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import type React from "react";
import { useCallback, useContext } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import type { NetworkContactItem } from "../../module/items/networkContact";
import { ThemeContext } from "../../themes/ThemeContext";
import { ItemNameWithIcon } from "../characters/ItemNameWithIcon";
import { DeleteItemButton } from "../inputs/DeleteItemButton";

/**
 * One contact on the Contacts tab: name, location and pool, and a delete
 * button. The rest of the row opens the contact's sheet (where they're used),
 * and drags the contact.
 */
export const NetworkContactRow = ({
  contact,
}: {
  contact: NetworkContactItem;
}) => {
  const app = useContext(FoundryAppContext);
  const theme = useContext(ThemeContext);
  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLAnchorElement>) => {
      if (app !== null) {
        (app as any)._onDragStart(e);
      }
    },
    [app],
  );
  const sheet = contact.sheet;
  assertApplicationV2(sheet);
  const exhausted = contact.system.pool === 0;

  return (
    // a subgrid, so the cells line up with the headers, and the row can be
    // one thing to hover
    <div
      css={{
        gridColumn: "1/-1",
        display: "grid",
        gridTemplateColumns: "subgrid",
        alignItems: "center",
        "&:hover": { backgroundColor: theme.colors.backgroundButton },
      }}
    >
      {/* everything but the delete button, to click and drag */}
      <a
        css={{
          gridColumn: "1/-2",
          display: "grid",
          gridTemplateColumns: "subgrid",
          alignItems: "center",
          padding: "0.2em 0",
          cursor: "pointer",
          opacity: exhausted ? 0.6 : 1,
          "&&:hover": { textDecoration: "none" },
          "& > *": {
            paddingInline: "0.25em",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          },
        }}
        onClick={() => sheet.render({ force: true })}
        data-item-id={contact.id}
        data-testid="network-contact-row"
        onDragStart={onDragStart}
        draggable="true"
      >
        <ItemNameWithIcon item={contact} title={contact.name ?? ""} />
        <div title={contact.system.location}>{contact.system.location}</div>
        <div data-testid="network-contact-pool" css={{ textAlign: "end" }}>
          {contact.system.pool}
        </div>
      </a>
      <DeleteItemButton item={contact} />
    </div>
  );
};

NetworkContactRow.displayName = "NetworkContactRow";
