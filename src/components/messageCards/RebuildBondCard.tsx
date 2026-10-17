import { useContext } from "react";

import type { RebuildOutcome, RebuildRecord } from "../../module/bonds/rebuild";
import { ThemeContext } from "../../themes/ThemeContext";
import { Translate } from "../Translate";
import { DieFace } from "./DiceTerms";

type RebuildBondCardProps = {
  record: RebuildRecord;
  imageUrl: string | null;
};

const outcomeText: Record<RebuildOutcome, string> = {
  successful6: "Successful 6",
  success: "Success",
  failure: "Failure",
  failed1: "Failed 1",
};

/**
 * The chat card for rebuilding a Bond (Fall of DELTA GREEN, p. 128). It's
 * all settled when the test is rolled, so it just shows the record.
 */
export const RebuildBondCard = ({ record, imageUrl }: RebuildBondCardProps) => {
  const theme = useContext(ThemeContext);
  const succeeded =
    record.outcome === "successful6" || record.outcome === "success";
  const spendTotal = record.total - record.die;

  return (
    <div
      className="dice-roll"
      data-testid="rebuild-bond-card"
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
          RebuildingBondWithBondName
        </Translate>
      </b>
      <div css={{ gridArea: "body" }}>
        <div>
          <Translate values={{ AbilityName: record.stabilityName }}>
            AbilityNameTest
          </Translate>
          {": "}
          <DieFace value={record.die} />
          {spendTotal > 0 && ` + ${spendTotal}`}
          {" = "}
          <b>{record.total}</b>{" "}
          <Translate values={{ Difficulty: String(record.difficulty) }}>
            DifficultyN
          </Translate>
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
          data-testid="rebuild-outcome"
          css={{
            fontWeight: "bold",
            fontSize: "1.2em",
            margin: "0.25em 0",
            color: succeeded ? theme.colors.success : theme.colors.danger,
          }}
        >
          <Translate>{outcomeText[record.outcome]}</Translate>
        </div>
        <div data-testid="rebuild-bond-change">
          {record.bondName}: {record.bondBefore} → {record.bondAfter}
        </div>
        {(record.refreshDie !== null ||
          record.stabilityAfter !== record.stabilityBefore) && (
          <div data-testid="rebuild-stability-change">
            {record.stabilityName}: {record.stabilityBefore} →{" "}
            {record.stabilityAfter}
            {record.refreshDie !== null && (
              <>
                {" ("}
                <Translate>Refresh</Translate>{" "}
                <DieFace value={record.refreshDie} />
                {record.outcome === "success" && (
                  <Translate>MinusTwoMinimumOne</Translate>
                )}
                {")"}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

RebuildBondCard.displayName = "RebuildBondCard";
