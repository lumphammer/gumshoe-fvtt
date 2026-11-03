import { useContext } from "react";

import type { ContactRecord } from "../../module/contacts/rules";
import { ThemeContext } from "../../themes/ThemeContext";
import { Translate } from "../Translate";
import { DieFace } from "./DiceTerms";

type NetworkContactCardProps = {
  record: ContactRecord;
  imageUrl: string | null;
};

/**
 * The chat card for a Network contact (Fall of DELTA GREEN, p. 068): points
 * given to them, a test of their pool, or a tap for information. It's all
 * settled when it's posted, so it just shows the record.
 */
export const NetworkContactCard = ({
  record,
  imageUrl,
}: NetworkContactCardProps) => {
  const theme = useContext(ThemeContext);

  return (
    <div
      className="dice-roll"
      data-testid="network-contact-card"
      css={{
        display: "grid",
        gridTemplateColumns: "max-content 1fr",
        gridTemplateAreas: '"image headline" "image body"',
        alignItems: "center",
      }}
    >
      <div
        css={{
          height: "4em",
          width: "4em",
          gridArea: "image",
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          transform: "scale(0.9) rotate(-5deg)",
          boxShadow: "0 0 0.5em black",
          marginRight: "1em",
          alignSelf: "start",
        }}
      />
      <div css={{ gridArea: "headline" }}>
        <b>{record.contactName}</b>
        {record.location && <i> ({record.location})</i>}
      </div>
      <div css={{ gridArea: "body" }}>
        <div data-testid="network-contact-action">
          {record.kind === "assign" ? (
            <Translate
              values={{
                Points: String(record.points),
                AbilityName: record.networkName ?? "",
              }}
            >
              GivenPointsAbilityNamePoints
            </Translate>
          ) : record.kind === "test" ? (
            <>
              <Translate>Test</Translate>
              {": "}
              <DieFace value={record.die ?? 0} />
              {record.points > 0 && ` + ${record.points}`}
              {" = "}
              <b css={{ fontSize: "1.2em" }}>{record.total}</b>
            </>
          ) : (
            <Translate>
              {record.points > 1
                ? "TappedForAMotherLode"
                : "TappedForInformation"}
            </Translate>
          )}
        </div>
        {record.kind === "assign" && (
          <div data-testid="network-contact-network-change">
            {record.networkName}: {record.networkBefore} → {record.networkAfter}
          </div>
        )}
        <div data-testid="network-contact-pool-change">
          <Translate>Pool</Translate>: {record.poolBefore} → {record.poolAfter}
        </div>
        {record.poolAfter === 0 && record.kind !== "assign" && (
          <div css={{ color: theme.colors.warning, fontStyle: "italic" }}>
            <Translate>Favors exhausted</Translate>
          </div>
        )}
      </div>
    </div>
  );
};

NetworkContactCard.displayName = "NetworkContactCard";
