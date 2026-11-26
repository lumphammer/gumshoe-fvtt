import React from "react";

import type { BondSpendRecord } from "../../module/bonds/bondSpends";
import type { InvestigatorItem } from "../../module/items/InvestigatorItem";
import type { DifficultyModifier } from "../../module/abilityTests/outcome";
import { Translate } from "../Translate";
import { useAbilityCardHeader } from "./useAbilityCardHeader";
import { DiceTerms } from "./DiceTerms";
import { DifficultyReminder, TestResolution } from "./TestResolution";
import type { AbilityCardMode } from "./types";
import { css, cx } from "../../styled-system/css";
import { clickable } from "../clickable";

interface AbilityTestCardProps {
  msg: ChatMessage;
  ability: InvestigatorItem | undefined;
  mode: AbilityCardMode;
  name: string | null;
  imageUrl: string | null;
  /** points spent from Bonds on a Stability test (Fall of DELTA GREEN) */
  bondSpends?: readonly BondSpendRecord[];
  /** what changed the Difficulty when tested (e.g. Shaken) */
  difficultyModifiers?: readonly DifficultyModifier[];
  /** null on cards from before tests had a Difficulty: then the modifiers
   * are reminders */
  difficulty?: { base: number | null; revealed: boolean } | null;
  /** the GM: can see a secret Difficulty, change it, and reveal it */
  canEditDifficulty?: boolean;
}

const noModifiers: readonly DifficultyModifier[] = [];

export const AbilityTestCard = React.memo(
  ({
    msg,
    ability,
    mode,
    name,
    imageUrl,
    bondSpends = [],
    difficultyModifiers = noModifiers,
    difficulty = null,
    canEditDifficulty = false,
  }: AbilityTestCardProps) => {
    const { header, openSheet: onClickAbilityName } =
      useAbilityCardHeader(ability);
    // plain text if it's gone (Foundry gives every <a> a pointer)
    const AbilityName = onClickAbilityName ? "a" : "span";

    return (
      <div
        className={cx(
          "dice-roll",
          css({
            position: "relative",
            display: "grid",
            gridTemplateColumns: "max-content 1fr",
            gridTemplateRows:
              "max-content minmax(0, max-content) max-content max-content",
            gridTemplateAreas:
              '"image headline" ' +
              '"image terms" ' +
              '"image body" ' +
              '"image resolution" ',
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
            <AbilityName {...clickable(onClickAbilityName)}>
              {name ?? header?.name ?? "Missing"}
            </AbilityName>
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
              {difficulty === null &&
                difficultyModifiers.map((modifier, i) => (
                  <DifficultyReminder key={i} modifier={modifier} />
                ))}
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
        {mode === "test" && difficulty !== null && (
          <div className={css({ gridArea: "resolution" })}>
            <TestResolution
              msg={msg}
              difficulty={difficulty}
              modifiers={difficultyModifiers}
              canEdit={canEditDifficulty}
            />
          </div>
        )}
      </div>
    );
  },
);

AbilityTestCard.displayName = "AbilityTestCard";
