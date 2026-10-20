import { useContext } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertPCActor } from "../../module/actors/pc";
import { settings } from "../../settings/settings";
import { ThemeContext } from "../../themes/ThemeContext";
import { absoluteCover } from "../absoluteCover";
import { Button } from "../inputs/Button";
import { Translate } from "../Translate";
import { NetworkContactRow } from "./NetworkContactRow";

/**
 * The Contacts tab on the PC sheet (Fall of DELTA GREEN, p. 068): what's left
 * in Network, and the contacts it's been given to.
 */
export const NetworkContactsArea = () => {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const theme = useContext(ThemeContext);
  const contacts = actor.system.getNetworkContacts();
  const network = actor.system.getNetworkAbility();
  const networkName = settings.networkAbility.get();
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
          onClick={actor.system.createNetworkContact}
          title={newContactTooltip}
        >
          <i className="fa fa-plus" />
          {/* Translate titles its span, which would hide the button's title */}
          <Translate title={newContactTooltip}>New contact</Translate>
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
              Pool: String(network.system.pool),
              Rating: String(network.system.rating),
              Held: String(actor.system.getContactPoints()),
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
            // name, location, pool
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 2fr) max-content",
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
};

NetworkContactsArea.displayName = "NetworkContactsArea";
