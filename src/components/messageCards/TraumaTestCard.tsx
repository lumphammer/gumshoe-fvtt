import { useContext } from "react";

import { isAdapted } from "../../module/bonds/adaptation";
import { getStabilityStateName } from "../../module/stability/settings";
import type { StabilityState } from "../../module/stability/states";
import type { TraumaTestRecord } from "../../module/stability/trauma";
import { ThemeContext } from "../../themes/ThemeContext";
import { Translate } from "../Translate";
import { DieFace } from "./DiceTerms";

type TraumaTestCardProps = {
  record: TraumaTestRecord;
  imageUrl: string | null;
};

/** What getting worse means, as reminders: disorders aren't tracked */
const reminders: Record<Exclude<StabilityState, "steady">, string> = {
  shaken: "ShakenReminder",
  shattered: "ShatteredReminder",
  gone: "GoneReminder",
};

/**
 * The chat card for a Stability test against trauma (Fall of DELTA GREEN,
 * pp. 115–121). It's all settled when it's rolled, so it just shows the
 * record.
 */
export const TraumaTestCard = ({ record, imageUrl }: TraumaTestCardProps) => {
  const theme = useContext(ThemeContext);
  const spendTotal = record.total - record.die;
  const { stateAfter } = record;

  return (
    <div
      className="dice-roll"
      data-testid="trauma-test-card"
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
        <Translate
          values={{
            Trauma: record.trauma,
            Loss: String(record.potentialLoss),
            Stability: record.stability.name,
          }}
        >
          StabilityTestAgainstTrauma
        </Translate>
      </b>
      <div css={{ gridArea: "body" }}>
        <div>
          <DieFace value={record.die} />
          {spendTotal > 0 && ` + ${spendTotal}`}
          {" = "}
          <b>{record.total}</b>{" "}
          <Translate values={{ Difficulty: String(record.difficulty) }}>
            DifficultyN
          </Translate>
          {/* what went into it */}
          {record.adapted && (
            <>
              {" ("}
              <Translate>Adapted</Translate>
              {")"}
            </>
          )}
          {record.shaken && (
            <>
              {" ("}
              {getStabilityStateName("shaken")}
              {" +1)"}
            </>
          )}
        </div>
        {record.spends.length > 0 && (
          <div>
            <Translate>Spent</Translate>
            {": "}
            {record.spends
              .map(({ name, spend }) => `${name} ${spend}`)
              .join(", ")}
          </div>
        )}
        <div
          data-testid="trauma-outcome"
          css={{
            fontWeight: "bold",
            fontSize: "1.2em",
            margin: "0.25em 0",
            color: record.succeeded
              ? theme.colors.success
              : theme.colors.danger,
          }}
        >
          {record.succeeded ? (
            <Translate>Holds steady</Translate>
          ) : (
            <Translate values={{ Loss: String(record.potentialLoss) }}>
              LosesLoss
            </Translate>
          )}
        </div>
        <div data-testid="trauma-stability">
          {`${record.stability.name}: ${record.stability.before} → ${record.stability.after}`}
        </div>
        {record.worsened && stateAfter !== "steady" && (
          <div
            data-testid="trauma-state"
            css={{ color: theme.colors.danger, margin: "0.25em 0" }}
          >
            <b>
              {getStabilityStateName(stateAfter)}
              {"! "}
            </b>
            <Translate>{reminders[stateAfter]}</Translate>
          </div>
        )}
        {record.stabilityRating && (
          <div data-testid="trauma-rating">
            <Translate values={{ Name: record.stabilityRating.name }}>
              NameRating
            </Translate>
            {`: ${record.stabilityRating.before} → ${record.stabilityRating.after}`}
          </div>
        )}
        {record.sanity && (
          <div data-testid="trauma-sanity">
            <Translate values={{ Name: record.sanity.name }}>
              NameRating
            </Translate>
            {`: ${record.sanity.before} → ${record.sanity.after}`}
          </div>
        )}
        {record.adaptation && (
          <div data-testid="trauma-adaptation">
            <Translate values={{ Trauma: record.trauma }}>
              AdaptingToTrauma
            </Translate>
            {`: ${record.adaptation.before} → ${record.adaptation.after}`}
            {isAdapted(record.adaptation.after) && (
              <>
                {" ("}
                <Translate>Adapted</Translate>
                {")"}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

TraumaTestCard.displayName = "TraumaTestCard";
