import { memo } from "react";

import { liveItems } from "../../functions/liveItems";
import { isNetworkContactItem } from "../../module/items/networkContact";
import { getTranslated } from "../../functions/getTranslated";
import { useActorAndSettings } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { assertPCActor } from "../../module/actors/pc";
import {
  getContactPointsIn,
  getNetworkAbilityIn,
  getNetworkContactsIn,
} from "../../module/actors/pcDerived";
import { absoluteCover } from "../absoluteCover";
import { Button } from "../inputs/Button";
import { Translate } from "../Translate";
import { NetworkContactRow } from "./NetworkContactRow";
import { tableHeader } from "../../styled-system/recipes";
import { css, cx } from "../../styled-system/css";

/**
 * The Contacts tab on the PC sheet (Fall of DELTA GREEN, p. 068): what's left
 * in Network, and the contacts it's been given to.
 */
export const NetworkContactsArea = memo(function NetworkContactsArea() {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const networkName = useSettings((s) => s.networkAbility);
  // the contacts' ids, by name; the Network ability's pool and rating; and
  // the points the contacts hold
  const { ids, network, held } = useActorAndSettings(
    actor,
    ({ items }, settings) => {
      const ability = getNetworkAbilityIn(items, settings);
      return {
        ids: getNetworkContactsIn(items).map((item) => item._id ?? ""),
        network: ability && {
          pool: ability.system.pool,
          rating: ability.system.rating,
        },
        held: getContactPointsIn(items),
      };
    },
  );
  // the live contacts, only to pass to the rows
  const contacts = liveItems(actor, ids, isNetworkContactItem);
  const { createNetworkContact } = useSystemMethods(actor);
  const newContactTooltip = getTranslated("NewContactTooltip", {
    AbilityName: networkName,
  });

  return (
    <div
      data-testid="network-contacts-area"
      className={css({ ...absoluteCover, overflow: "auto", padding: "0.5em" })}
    >
      <div
        className={css({
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "0.5em",
        })}
      >
        <h2 className={css({ flex: "[1]", "&&": { margin: 0 } })}>
          <Translate>Contacts</Translate>
        </h2>
        <Button
          className={css({ flexBasis: "max-content" })}
          onClick={createNetworkContact}
          title={newContactTooltip}
        >
          <i className="fa fa-plus" />
          <Translate>New contact</Translate>
        </Button>
      </div>
      <div data-testid="network-summary" className={css({ margin: "0.5em 0" })}>
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
        <i className={css({ display: "block", fontSize: "1.2em" })}>
          <Translate>No contacts yet!</Translate>
        </i>
      ) : (
        <div
          className={css({
            display: "grid",
            // name, location, pool, delete
            gridTemplateColumns:
              "minmax(0, 2fr) minmax(0, 2fr) max-content max-content",
            gridAutoRows: "min-content",
            columnGap: "0.5em",
          })}
        >
          {/* the header row, underlined like the ability categories */}
          <div
            className={cx(
              tableHeader(),
              css({
                gridColumn: "1/-1",
                display: "grid",
                gridTemplateColumns: "subgrid",
                "& > *": { paddingInline: "0.25em" },
              }),
            )}
          >
            <div>
              <Translate>Name</Translate>
            </div>
            <div>
              <Translate>Location</Translate>
            </div>
            <div className={css({ textAlign: "end" })}>
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
