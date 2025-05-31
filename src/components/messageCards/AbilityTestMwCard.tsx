import React, { useCallback } from "react";

import { assertApplicationV2 } from "../../functions/utilities";
import { AbilityItem } from "../../module/items/exports";
import { MWDifficulty } from "../../types";
import { Translate } from "../Translate";
import { DiceTerms } from "./DiceTerms";
import { MwButton } from "./MwButton";
import { MwCostSlug } from "./MwCostSlug";
import { MWResult } from "./types";

interface AbilityTestMwCardProps {
  msg: ChatMessage;
  ability: AbilityItem | undefined;
  difficulty: MWDifficulty;
  boonLevy: number;
  reRoll: number | undefined;
  pool: number;
  name: string | null;
}

const results: { [value: number]: MWResult } = {
  1: {
    text: "Dismal Failure",
    color: "#fe083f",
  },
  2: {
    text: "Quotidian Failure",
    color: "#fd5a00",
  },
  3: {
    text: "Exasperating Failure",
    color: "#eb8b00",
  },
  4: {
    text: "Hair’s-Breadth Success",
    color: "#c9b500",
  },
  5: {
    text: "Prosaic Success",
    color: "#94d900",
  },
  6: {
    text: "Illustrious Success",
    color: "#0cf850",
  },
};

export const AbilityTestMwCard = React.memo(
  ({
    msg,
    ability,
    difficulty,
    boonLevy,
    reRoll,
    pool,
    name,
  }: AbilityTestMwCardProps) => {
    const sheet = ability?.sheet;
    assertApplicationV2(sheet);

    const onClickAbilityName = useCallback(() => {
      void sheet.render({ force: true });
    }, [sheet]);

    const cappedResult = Math.max(Math.min(msg.rolls?.[0]?.total ?? 1, 6), 1);
    const effectiveResult =
      difficulty === "easy" && cappedResult === 3 ? 4 : cappedResult;
    const deets = results[effectiveResult];

    const onClickReRoll = useCallback(() => {
      void ability?.system.mwTestAbility(difficulty, boonLevy, effectiveResult);
    }, [ability, boonLevy, difficulty, effectiveResult]);

    const boonLevyFactor =
      boonLevy < 0 ? (
        <MwCostSlug>
          <Translate>Levy</Translate>: {boonLevy}
        </MwCostSlug>
      ) : boonLevy > 0 ? (
        <MwCostSlug>
          <Translate>Boon</Translate>: +{boonLevy}
        </MwCostSlug>
      ) : null;

    const reRollFactor = reRoll && (
      <MwCostSlug>
        <Translate>Re-roll</Translate>: {reRoll === 1 ? "-4" : "-1"}
      </MwCostSlug>
    );

    return (
      <div
        className="dice-roll"
        css={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1fr",
          gridTemplateRows: "max-content minmax(0, max-content) max-content",
          gridTemplateAreas: '"headline" ' + '"pool" ' + '"body" ',
          alignItems: "center",
        }}
      >
        {/* HEADLINE */}
        <div
          css={{
            gridArea: "headline",
          }}
        >
          <b>
            <a onClick={onClickAbilityName}>
              {name ?? ability?.name ?? "Missing"}
            </a>
          </b>{" "}
          <DiceTerms terms={msg.rolls?.[0]?.terms} />
          {difficulty === "easy" && (
            <span>
              (<Translate>Easy</Translate>)
            </span>
          )}
          {difficulty === -1 && (
            <span>
              (<Translate>Hard</Translate>)
            </span>
          )}
          {difficulty !== "easy" && difficulty < -1 && (
            <span>
              (<Translate>Very Hard</Translate>)
            </span>
          )}
        </div>
        {/* POOL */}
        <div
          css={{
            gridArea: "pool",
          }}
        >
          <Translate>Pool</Translate>: {pool}
          {boonLevyFactor}
          {reRollFactor}
        </div>
        {/* RESULT */}
        <MwButton onClick={onClickReRoll} deets={deets} />
      </div>
    );
  },
);

AbilityTestMwCard.displayName = "AbilityTestMwCard";
