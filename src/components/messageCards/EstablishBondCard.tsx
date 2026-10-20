import { useContext } from "react";

import type {
  EstablishOutcome,
  EstablishRecord,
} from "../../module/bonds/establish";
import { establishCost } from "../../module/bonds/establish";
import { isBondBroken } from "../../module/bonds/rules";
import { ThemeContext } from "../../themes/ThemeContext";
import { Translate } from "../Translate";
import { DieFace } from "./DiceTerms";

type EstablishBondCardProps = {
  record: EstablishRecord;
  imageUrl: string | null;
};

const outcomeText: Record<EstablishOutcome, string> = {
  rejected: "Rejected",
  bonded: "Bonded",
  bonded6: "Bonded6",
};

/**
 * The chat card for establishing a new Bond (Fall of DELTA GREEN, p. 129).
 * It's all settled when the die is rolled, so it just shows the record.
 */
export const EstablishBondCard = ({
  record,
  imageUrl,
}: EstablishBondCardProps) => {
  const theme = useContext(ThemeContext);
  const bonded = record.bondPoints !== null;

  return (
    <div
      className="dice-roll"
      data-testid="establish-bond-card"
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
      <b css={{ gridArea: "headline" }}>
        <Translate values={{ BondName: record.bondName }}>
          {record.reformed
            ? "ReformingBondWithBondName"
            : "EstablishingBondWithBondName"}
        </Translate>
      </b>
      <div css={{ gridArea: "body" }}>
        <div>
          <DieFace value={record.die} />
        </div>
        <div
          data-testid="establish-outcome"
          css={{
            fontWeight: "bold",
            fontSize: "1.2em",
            margin: "0.25em 0",
            color: bonded ? theme.colors.success : theme.colors.danger,
          }}
        >
          <Translate>{outcomeText[record.outcome]}</Translate>
        </div>
        {bonded && (
          <div data-testid="establish-bond-points">
            {record.bondName}: {record.bondPoints}
          </div>
        )}
        <div data-testid="establish-spent">
          <Translate>Spent</Translate>
          {`: ${record.abilityName} ${establishCost}`}
          {record.outcome === "bonded6" && (
            <>
              {" ("}
              <Translate>Refunded</Translate>
              {")"}
            </>
          )}
        </div>
        {record.neglected && (
          <div data-testid="establish-neglected">
            <Translate>Neglected</Translate>
            {`: ${record.neglected.name} ${record.neglected.before} → ${record.neglected.after}`}
            {isBondBroken(record.neglected.after) &&
              !isBondBroken(record.neglected.before) && (
                <>
                  {" ("}
                  <Translate>Broken</Translate>
                  {")"}
                </>
              )}
          </div>
        )}
        {record.stability && (
          <div data-testid="establish-stability">
            {record.stability.name}: {record.stability.before} →{" "}
            {record.stability.after}
          </div>
        )}
      </div>
    </div>
  );
};

EstablishBondCard.displayName = "EstablishBondCard";
