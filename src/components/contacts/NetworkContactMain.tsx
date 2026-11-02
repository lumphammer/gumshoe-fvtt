import { useState } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import {
  assignNetworkPoints,
  tapContact,
  testContact,
} from "../../module/contacts/contactActions";
import { getMaxAssignablePoints } from "../../module/contacts/rules";
import type {
  NetworkContactItem,
  NetworkContactSystemData,
} from "../../module/items/networkContact";
import { absoluteCover } from "../absoluteCover";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { RichTextEditor } from "../inputs/RichTextEditor";
import { SpendButtons } from "../inputs/SpendButtons";
import { Translate } from "../Translate";

/**
 * A Network contact's sheet (Fall of DELTA GREEN, p. 068): who and where they
 * are, their pool, and the three things to do with them: give them more
 * Network points, have them act (a test of their pool), or tap them for
 * information.
 */
/** a line across the sheet, between who the contact is and what they do */
const Divider = () => {
  "use memo";

  return <hr css={{ gridColumn: "1/-1", width: "100%", margin: "0.25em 0" }} />;
};

type NetworkContactMainProps = {
  /** only to write through, and to act on */
  item: NetworkContactItem;
  name: string;
  system: NetworkContactSystemData;
  /** only a PC's contacts can be given points, tested or tapped */
  isOnPC: boolean;
  /** the PC's Network pool, or null if they have no Network ability */
  networkPool: number | null;
  networkName: string;
};

export const NetworkContactMain = ({
  item,
  name,
  system,
  isOnPC,
  networkPool,
  networkName,
}: NetworkContactMainProps) => {
  "use memo";

  const methods = useSystemMethods(item);
  const [give, setGive] = useState(0);
  const [spend, setSpend] = useState(0);
  const pool = system.pool;

  return (
    <InputGrid
      css={{
        ...absoluteCover,
        // name, location, pool, then the actions, with dividers; the notes
        // fill the rest
        gridTemplateRows: `repeat(${isOnPC ? 10 : 4}, auto) 1fr`,
      }}
    >
      <GridField label="Name">
        <AsyncTextInput value={name} onChange={item.setName} />
      </GridField>
      <GridField label="Location">
        <AsyncTextInput
          value={system.location}
          onChange={methods.setLocation}
        />
      </GridField>
      <Divider />
      <GridField label="Pool">
        <span data-testid="contact-pool">
          {pool}
          {networkPool !== null && (
            <>
              {" "}
              (
              <Translate
                values={{
                  AbilityName: networkName,
                  Pool: String(networkPool),
                }}
              >
                AbilityNamePoolLeft
              </Translate>
              )
            </>
          )}
        </span>
      </GridField>
      {isOnPC && (
        <>
          <GridField
            label={getTranslated("GiveAbilityNamePoints", {
              AbilityName: networkName,
            })}
            noTranslate
          >
            {networkPool === null ? (
              <i>
                <Translate values={{ AbilityName: networkName }}>
                  NoAbilityNameAbility
                </Translate>
              </i>
            ) : (
              <div
                data-testid="give-row"
                css={{ display: "flex", gap: "0.5em", alignItems: "center" }}
              >
                <SpendButtons
                  value={give}
                  onChange={setGive}
                  max={getMaxAssignablePoints(networkPool)}
                />
                <Button
                  data-testid="give-network-points"
                  disabled={give === 0}
                  onClick={() => {
                    void assignNetworkPoints(item, give);
                    setGive(0);
                  }}
                >
                  <Translate>Give</Translate>
                </Button>
              </div>
            )}
          </GridField>
          <Divider />
          <GridField label="Act">
            <div data-testid="act-row">
              <SpendButtons value={spend} onChange={setSpend} max={pool} />
            </div>
          </GridField>
          <GridField noLabel>
            <Button
              data-testid="test-contact"
              css={{ width: "100%" }}
              // with nothing left, the favors are used up
              disabled={pool === 0}
              onClick={() => {
                void testContact(item, spend);
                setSpend(0);
              }}
            >
              <Translate>Test</Translate> <i className="fa fa-dice" />
            </Button>
          </GridField>
          <Divider />
          <GridField label="Information">
            <div css={{ display: "flex", gap: "0.5em" }}>
              <Button
                data-testid="tap-contact-1"
                disabled={pool < 1}
                onClick={() => void tapContact(item, 1)}
              >
                <Translate>Tap for 1 point</Translate>
              </Button>
              <Button
                data-testid="tap-contact-2"
                disabled={pool < 2}
                onClick={() => void tapContact(item, 2)}
              >
                <Translate>Mother lode for 2 points</Translate>
              </Button>
            </div>
          </GridField>
        </>
      )}
      <div css={{ position: "relative", gridColumn: "1/-1" }}>
        <RichTextEditor
          html={system.notes}
          onSave={methods.setNotes}
          name="notes"
        />
      </div>
    </InputGrid>
  );
};

NetworkContactMain.displayName = "NetworkContactMain";
