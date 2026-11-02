import { memo, useContext } from "react";

import { findGeneralAbilityIn } from "../../module/items/findGeneralAbility";
import * as c from "../../constants";
import { getTranslated } from "../../functions/getTranslated";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { assertPCActor } from "../../module/actors/pc";
import type { NetworkContactItem } from "../../module/items/networkContact";
import { ThemeContext } from "../../themes/ThemeContext";
import { absoluteCover } from "../absoluteCover";
import { Button } from "../inputs/Button";
import { Translate } from "../Translate";
import { NetworkContactRow } from "./NetworkContactRow";

/**
 * The Contacts tab on the PC sheet (Fall of DELTA GREEN, p. 068): what's left
 * in Network, and the contacts it's been given to.
 */
export const NetworkContactsArea = memo(function NetworkContactsArea() {
  "use memo";

  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const theme = useContext(ThemeContext);
  const networkName = useSettings((s) => s.networkAbility);
  // the contacts' ids, by name; the Network ability's pool and rating; and
  // the points the contacts hold (as `getNetworkContacts`,
  // `getNetworkAbility` and `getContactPoints` work them out)
  const { ids, network, held } = useActorSnapshot(actor, (snapshot) => {
    const items = snapshot.items;
    const contacts = items
      .filter((item) => item.type === c.networkContact)
      .toSorted((a, b) => a.name.localeCompare(b.name));
    const ability = findGeneralAbilityIn(items, networkName);
    return {
      ids: contacts.map((item) => item._id ?? ""),
      network: ability && {
        pool: ability.system.pool,
        rating: ability.system.rating,
      },
      held: contacts.reduce((total, item) => total + item.system.pool, 0),
    };
  });
  // the live contacts, only to pass to the rows
  const contacts = ids.flatMap((id) => {
    const item = actor.items.get(id) as NetworkContactItem | undefined;
    return item ? [item] : [];
  });
  const { createNetworkContact } = useSystemMethods(actor);
  const newContactTooltip = getTranslated("NewContactTooltip", {
    AbilityName: networkName,
  });

  return (
    <div
      data-testid="network-contacts-area"
      css={{ ...absoluteCover, overflow: "auto", padding: "0.5em" }}
    >
      <div
        css={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "0.5em",
        }}
      >
        <h2 css={{ flex: 1, "&&": { margin: 0 } }}>
          <Translate>Contacts</Translate>
        </h2>
        <Button
          css={{ flexBasis: "max-content" }}
          onClick={createNetworkContact}
          title={newContactTooltip}
        >
          <i className="fa fa-plus" />
          <Translate>New contact</Translate>
        </Button>
      </div>
      <div data-testid="network-summary" css={{ margin: "0.5em 0" }}>
        {network === undefined ? (
          <i>
            <Translate values={{ AbilityName: networkName }}>
              NoAbilityNameAbility
            </Translate>
          </i>
        ) : (
          <Translate
            values={{
              AbilityName: networkName,
              Pool: String(network.pool),
              Rating: String(network.rating),
              Held: String(held),
            }}
          >
            NetworkSummary
          </Translate>
        )}
      </div>

      {contacts.length === 0 ? (
        <i css={{ display: "block", fontSize: "1.2em" }}>
          <Translate>No contacts yet!</Translate>
        </i>
      ) : (
        <div
          css={{
            display: "grid",
            // name, location, pool, delete
            gridTemplateColumns:
              "minmax(0, 2fr) minmax(0, 2fr) max-content max-content",
            gridAutoRows: "min-content",
            columnGap: "0.5em",
          }}
        >
          {/* the header row, underlined like the ability categories */}
          <div
            css={{
              gridColumn: "1/-1",
              display: "grid",
              gridTemplateColumns: "subgrid",
              fontWeight: "bold",
              borderBottom: `1px solid ${theme.colors.text}`,
              "& > *": { paddingInline: "0.25em" },
            }}
          >
            <div>
              <Translate>Name</Translate>
            </div>
            <div>
              <Translate>Location</Translate>
            </div>
            <div css={{ textAlign: "end" }}>
              <Translate>Pool</Translate>
            </div>
          </div>
          {contacts.map((contact) => (
            <NetworkContactRow key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </div>
  );
});

NetworkContactsArea.displayName = "NetworkContactsArea";
