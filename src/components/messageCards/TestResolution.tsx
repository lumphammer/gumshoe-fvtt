import { useState } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { systemLogger } from "../../functions/utilities";

import { useSettings } from "../../hooks/useSettings";
import { useStabilityStateName } from "../../hooks/useStabilityStateName";
import type { AbilityTestEdit } from "../../module/abilityTests/abilityTestEdits";
import { editAbilityTest } from "../../module/abilityTests/editAbilityTest";
import type {
  DifficultyModifier,
  TestOutcome,
} from "../../module/abilityTests/outcome";
import {
  difficultyChoices,
  getTestDifficulty,
  getTestOutcome,
  isSuccessfulOutcome,
  standardDifficulty,
} from "../../module/abilityTests/outcome";
import { nativeStatus } from "../native/nativeStatus";
import { Translate } from "../Translate";
import { css, cx } from "../../styled-system/css";

const outcomeText: Record<TestOutcome, string> = {
  successful6: "Successful 6",
  success: "Success",
  failure: "Failure",
  failed1: "Failed 1",
};

/** the GM's choice to take a test's Difficulty away */
const noDifficulty = "none";

const signed = (amount: number) => (amount < 0 ? `${amount}` : `+${amount}`);

const ModifierLabel = ({ modifier }: { modifier: DifficultyModifier }) => {
  const stateName = useStabilityStateName(modifier.state);
  return (
    <span data-testid="difficulty-modifier">
      {" "}
      {stateName} {signed(modifier.amount)}
    </span>
  );
};

/**
 * What changes the Difficulty, as a reminder: on a request, and on cards from
 * before tests had a Difficulty
 */
export const DifficultyReminder = ({
  modifier,
}: {
  modifier: DifficultyModifier;
}) => {
  const stateName = useStabilityStateName(modifier.state);
  return (
    <div data-testid="shaken-reminder">
      <Translate
        values={{ State: stateName, Penalty: String(modifier.amount) }}
      >
        StateDifficultyReminder
      </Translate>
    </div>
  );
};

const columnClass = css({
  display: "flex",
  flexDirection: "column",
  gap: "0.25em",
  marginTop: "0.25em",
});

/** Make an edit, with the buttons disabled until it's been sent */
const useEdit = (msg: ChatMessage) => {
  const [busy, setBusy] = useState(false);
  const edit = (edit: AbilityTestEdit) => {
    setBusy(true);
    editAbilityTest(msg, edit).then(
      (result) => {
        // "requested" settles when the card changes, which remounts it
        if (result === "failed") setBusy(false);
      },
      (error: unknown) => {
        setBusy(false);
        systemLogger.error(error);
        ui.notifications?.error(String(error));
      },
    );
  };
  return { busy, edit };
};

type TestRequestProps = {
  msg: ChatMessage;
  /** the GM: sets the Difficulty */
  isGM: boolean;
  /** whoever asked: can roll without a Difficulty, or withdraw */
  isRequester: boolean;
};

/** A test waiting for the GM to set its Difficulty */
export const TestRequest = ({ msg, isGM, isRequester }: TestRequestProps) => {
  // if the default is to ask, start from the usual
  const defaultDifficulty = useSettings(
    (s) => s.defaultTestDifficulty ?? standardDifficulty,
  );
  const [base, setBase] = useState(defaultDifficulty);
  const { busy, edit } = useEdit(msg);

  return (
    <div className={columnClass}>
      <div data-testid="test-requested">
        <i className="fas fa-hourglass-half" />{" "}
        <Translate>Waiting for the GM's Difficulty</Translate>
      </div>
      {isGM && (
        <div
          className={css({
            display: "flex",
            gap: "0.25em",
            alignItems: "center",
          })}
        >
          <Translate>Difficulty</Translate>
          <select
            value={base}
            onChange={(e) => setBase(Number(e.currentTarget.value))}
            aria-label="Difficulty"
            data-testid="test-request-difficulty"
            className={css({ flex: "1", minWidth: "0", width: "auto" })}
          >
            {difficultyChoices(base).map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </div>
      )}
      {isGM && (
        <button
          type="button"
          // Foundry's primary button
          className="bright"
          disabled={busy}
          onClick={() => edit({ kind: "roll", base })}
        >
          <i className="fas fa-dice" /> <Translate>Roll</Translate>
        </button>
      )}
      {(isGM || isRequester) && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => edit({ kind: "roll", base: null })}
          >
            <i className="fas fa-dice-d6" />{" "}
            <Translate>Roll without a Difficulty</Translate>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => edit({ kind: "cancel" })}
          >
            <i className="fas fa-ban" /> <Translate>Cancel test</Translate>
          </button>
        </>
      )}
    </div>
  );
};

type TestResolutionProps = {
  msg: ChatMessage;
  /** base is null if it was rolled without one */
  difficulty: { base: number | null; hidden: boolean };
  modifiers: readonly DifficultyModifier[];
  /** the GM: always sees the Difficulty, and can change it */
  isGM: boolean;
};

/**
 * A rolled test's Difficulty and whether it succeeded. With the Difficulty
 * hidden, players only see whether it succeeded.
 */
export const TestResolution = ({
  msg,
  difficulty,
  modifiers,
  isGM,
}: TestResolutionProps) => {
  const roll = msg.rolls?.[0];
  const die = roll?.dice[0]?.total ?? 0;
  const total = roll?.total ?? 0;
  const finalDifficulty =
    difficulty.base === null
      ? null
      : getTestDifficulty(difficulty.base, modifiers);
  const outcome =
    finalDifficulty === null
      ? null
      : getTestOutcome({ die, total, difficulty: finalDifficulty });
  const showNumber = isGM || !difficulty.hidden;

  const onChangeBase = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const picked = e.currentTarget.value;
    const base = picked === noDifficulty ? null : Number(picked);
    if (base !== difficulty.base) {
      void editAbilityTest(msg, { kind: "setDifficulty", base });
    }
  };

  return (
    <div className={columnClass}>
      {isGM ? (
        <div data-testid="test-difficulty">
          <Translate>Difficulty</Translate>{" "}
          <select
            value={difficulty.base ?? noDifficulty}
            onChange={onChangeBase}
            aria-label="Difficulty"
            data-testid="test-difficulty-input"
            className={css({ width: "auto" })}
          >
            <option value={noDifficulty}>
              {getTranslated("No Difficulty")}
            </option>
            {difficultyChoices(difficulty.base ?? undefined).map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
          {modifiers.map((modifier, i) => (
            <ModifierLabel key={i} modifier={modifier} />
          ))}
          {finalDifficulty !== null && modifiers.length > 0 && (
            <>
              {" = "}
              <b>{finalDifficulty}</b>
            </>
          )}
        </div>
      ) : (
        showNumber &&
        difficulty.base !== null && (
          <div data-testid="test-difficulty">
            <Translate>Difficulty</Translate> {difficulty.base}
            {modifiers.map((modifier, i) => (
              <ModifierLabel key={i} modifier={modifier} />
            ))}
            {modifiers.length > 0 && (
              <>
                {" = "}
                <b>{finalDifficulty}</b>
              </>
            )}
          </div>
        )
      )}
      {outcome === null ? (
        <div data-testid="test-no-difficulty">
          <Translate>No Difficulty</Translate>
        </div>
      ) : (
        <div
          data-testid="test-outcome"
          className={cx(
            nativeStatus({
              tone: isSuccessfulOutcome(outcome) ? "success" : "danger",
            }),
            css({ fontWeight: "bold", fontSize: "1.2em" }),
          )}
        >
          <Translate>{outcomeText[outcome]}</Translate>
        </div>
      )}
    </div>
  );
};
