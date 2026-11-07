import { isAdapted } from "../../module/bonds/adaptation";
import type { StabilityState } from "../../module/stability/states";
import type { TraumaTestRecord } from "../../module/stability/trauma";
import { useSettings } from "../../hooks/useSettings";
import { useStabilityStateName } from "../../hooks/useStabilityStateName";
import { nativeStatus } from "../native/nativeStatus";
import { Translate } from "../Translate";
import { DieFace } from "./DiceTerms";
import { css, cx } from "../../styled-system/css";

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
  const genericOccupation = useSettings((s) => s.genericOccupation);
  const spendTotal = record.total - record.die;
  const { stateAfter } = record;
  const shakenName = useStabilityStateName("shaken");
  const stateAfterName = useStabilityStateName(stateAfter);

  return (
    <div
      className={cx(
        "dice-roll",
        css({
          display: "grid",
          gridTemplateColumns: "max-content 1fr",
          gridTemplateAreas: '"image headline" "image body"',
          alignItems: "center",
        }),
      )}
      data-testid="trauma-test-card"
    >
      <div
        className={css({
          height: "4em",
          width: "4em",
          gridArea: "image",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          transform: "scale(0.9) rotate(-5deg)",
          boxShadow: "[0 0 0.5em black]",
          marginRight: "1em",
          alignSelf: "start",
        })}
        style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : undefined }}
      />
      <b className={css({ gridArea: "headline" })}>
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
      <div className={css({ gridArea: "body" })}>
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
              {shakenName}
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
          className={cx(
            nativeStatus({
              tone: record.succeeded ? "success" : "danger",
            }),
            css({
              fontWeight: "bold",
              fontSize: "1.2em",
              margin: "0.25em 0",
            }),
          )}
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
            className={cx(
              nativeStatus({ tone: "danger" }),
              css({ margin: "0.25em 0" }),
            )}
          >
            <b>
              {stateAfterName}
              {"! "}
            </b>
            <Translate values={{ GenericOccupation: genericOccupation }}>
              {reminders[stateAfter]}
            </Translate>
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
