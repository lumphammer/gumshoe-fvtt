import { useContext } from "react";

import type { CrisisRecord } from "../../module/bonds/crisis";
import { isBondBroken } from "../../module/bonds/rules";
import { ThemeContext } from "../../themes/ThemeContext";
import { Translate } from "../Translate";
import { DieFace } from "./DiceTerms";

type TeamCrisisCardProps = {
  record: CrisisRecord;
  imageUrl: string | null;
};

const changeText: Record<CrisisRecord["changes"][number]["kind"], string> = {
  new: "New",
  reform: "Reformed",
  strengthen: "Strengthened",
};

/**
 * The chat card for the Stability test after a team crisis (Fall of DELTA
 * GREEN, p. 046). It's all settled when it's rolled, so it just shows the
 * record.
 */
export const TeamCrisisCard = ({ record, imageUrl }: TeamCrisisCardProps) => {
  const theme = useContext(ThemeContext);
  const spendTotal = record.total - record.die;

  return (
    <div
      className="dice-roll"
      data-testid="team-crisis-card"
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
        <Translate>Team Crisis</Translate>
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
          data-testid="crisis-outcome"
          css={{
            fontWeight: "bold",
            fontSize: "1.2em",
            margin: "0.25em 0",
            color: record.succeeded
              ? theme.colors.success
              : theme.colors.danger,
          }}
        >
          <Translate>
            {record.succeeded ? "Holds together" : "Bonds form"}
          </Translate>
        </div>
        {record.changes.map((change) => (
          <div key={change.name} data-testid="crisis-change">
            <Translate>{changeText[change.kind]}</Translate>
            {`: ${change.name} `}
            {change.before === null
              ? change.after
              : `${change.before} → ${change.after}`}
          </div>
        ))}
        {record.losses.map((loss) => (
          <div key={loss.name} data-testid="crisis-loss">
            <Translate>Lost</Translate>
            {`: ${loss.name} ${loss.before} → ${loss.after}`}
            {isBondBroken(loss.after) && !isBondBroken(loss.before) && (
              <>
                {" ("}
                <Translate>Broken</Translate>
                {")"}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

TeamCrisisCard.displayName = "TeamCrisisCard";
