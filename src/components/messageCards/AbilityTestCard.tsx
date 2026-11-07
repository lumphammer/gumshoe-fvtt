import React from "react";

import type { BondSpendRecord } from "../../module/bonds/bondSpends";
import type { InvestigatorItem } from "../../module/items/InvestigatorItem";
import type { StabilityState } from "../../module/stability/states";
import { useStabilityStateName } from "../../hooks/useStabilityStateName";
import { shakenDifficultyPenalty } from "../../module/stability/trauma";
import { Translate } from "../Translate";
import { useAbilityCardHeader } from "./useAbilityCardHeader";
import { DiceTerms } from "./DiceTerms";
import type { AbilityCardMode } from "./types";
import { css, cx } from "../../styled-system/css";

interface AbilityTestCardProps {
  msg: ChatMessage;
  ability: InvestigatorItem | undefined;
  mode: AbilityCardMode;
  name: string | null;
  imageUrl: string | null;
  /** points spent from Bonds on a Stability test (Fall of DELTA GREEN) */
  bondSpends?: BondSpendRecord[];
  /** Shaken or worse when tested: a reminder of the +1 Difficulty */
  stabilityState?: StabilityState | null;
}

export const AbilityTestCard = React.memo(
  ({
    msg,
    ability,
    mode,
    name,
    imageUrl,
    bondSpends = [],
    stabilityState = null,
  }: AbilityTestCardProps) => {
    const stateName = useStabilityStateName(stabilityState);
    const { header, openSheet: onClickAbilityName } =
      useAbilityCardHeader(ability);

    return (
      <div
        className={cx(
          "dice-roll",
          css({
            position: "relative",
            display: "grid",
            gridTemplateColumns: "max-content 1fr",
            gridTemplateRows: "max-content minmax(0, max-content) max-content",
            gridTemplateAreas:
              '"image headline" ' + '"image terms" ' + '"image body" ',
            alignItems: "center",
          }),
        )}
      >
        {/* IMAGE */}
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
          style={{ backgroundImage: `url(${header?.img ?? imageUrl})` }}
        />
        {/* HEADLINE */}
        <div
          className={css({
            gridArea: "headline",
          })}
        >
          <b>
            <a onClick={onClickAbilityName}>
              {name ?? header?.name ?? "Missing"}
            </a>
          </b>
        </div>
        {/* TERMS */}
        <div
          className={css({
            gridArea: "terms",
          })}
        >
          {mode === "spend" && <Translate>PointSpend</Translate>}
          {mode === "test" && (
            <>
              <Translate>AbilityTest</Translate>
              {": "}
              <DiceTerms terms={msg.rolls?.[0]?.terms} />
              {" ="}
              {bondSpends.length > 0 && (
                <div data-testid="bond-spends">
                  <Translate>Bonds</Translate>
                  {": "}
                  {bondSpends
                    .map(({ name, spend }) => `${name} ${spend}`)
                    .join(", ")}
                </div>
              )}
              {stabilityState !== null && (
                <div data-testid="shaken-reminder">
                  <Translate
                    values={{
                      State: stateName,
                      Penalty: String(shakenDifficultyPenalty),
                    }}
                  >
                    StateDifficultyReminder
                  </Translate>
                </div>
              )}
            </>
          )}
        </div>
        {/* RESULT */}
        <a
          className={cx(
            "dice-total",
            css({
              gridArea: "body",
              "&&": {
                marginTop: "0.5em",
              },
            }),
          )}
        >
          {msg.rolls?.[0]?.total}
        </a>
      </div>
    );
  },
);

AbilityTestCard.displayName = "AbilityTestCard";
