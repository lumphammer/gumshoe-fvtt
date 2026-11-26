import type {
  DifficultyModifier,
  TestOutcome,
} from "../../module/abilityTests/outcome";
import {
  getTestDifficulty,
  getTestOutcome,
  isSuccessfulOutcome,
} from "../../module/abilityTests/outcome";
import {
  setAbilityTestDifficulty,
  setAbilityTestRevealed,
} from "../../module/abilityTests/abilityTestEdits";
import { useStabilityStateName } from "../../hooks/useStabilityStateName";
import { nativeStatus } from "../native/nativeStatus";
import { Translate } from "../Translate";
import { css, cx } from "../../styled-system/css";

const outcomeText: Record<TestOutcome, string> = {
  successful6: "Successful 6",
  success: "Success",
  failure: "Failure",
  failed1: "Failed 1",
};

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

/** A reminder of what would change the Difficulty, for tests without one */
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

type TestResolutionProps = {
  msg: ChatMessage;
  /** base is null until the GM sets it */
  difficulty: { base: number | null; revealed: boolean };
  modifiers: readonly DifficultyModifier[];
  /** the GM: can see a secret Difficulty, change it, and reveal it */
  canEdit: boolean;
};

/**
 * A test's Difficulty and whether it succeeded. Players only see them once
 * the GM reveals them, and nobody sees how it went until there's a Difficulty.
 */
export const TestResolution = ({
  msg,
  difficulty,
  modifiers,
  canEdit,
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

  if (!canEdit && !difficulty.revealed) {
    return (
      <div data-testid="test-difficulty-secret">
        <Translate>SecretDifficulty</Translate>
      </div>
    );
  }

  if (!canEdit && difficulty.base === null) {
    return (
      <div data-testid="test-difficulty-awaited">
        <Translate>Waiting for the GM to set the Difficulty</Translate>
      </div>
    );
  }

  const onChangeBase = (e: React.FocusEvent<HTMLInputElement>) => {
    const text = e.currentTarget.value;
    // blank unsets it
    const base = text === "" ? null : Number(text);
    if (base !== null && !Number.isInteger(base)) {
      e.currentTarget.value =
        difficulty.base === null ? "" : String(difficulty.base);
      return;
    }
    if (base !== difficulty.base) {
      void setAbilityTestDifficulty(msg, base);
    }
  };

  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: "0.25em",
        marginTop: "0.25em",
      })}
    >
      <div data-testid="test-difficulty">
        <Translate>Difficulty</Translate>{" "}
        {canEdit ? (
          <input
            // remount when the value changes underneath us
            key={difficulty.base ?? "unset"}
            type="number"
            step={1}
            defaultValue={difficulty.base ?? ""}
            placeholder="?"
            onBlur={onChangeBase}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            aria-label="Difficulty"
            data-testid="test-difficulty-input"
            className={css({ width: "3em", height: "auto" })}
          />
        ) : (
          modifiers.length === 0 && <b>{difficulty.base}</b>
        )}
        {modifiers.length > 0 && (
          <>
            {!canEdit && difficulty.base}
            {modifiers.map((modifier, i) => (
              <ModifierLabel key={i} modifier={modifier} />
            ))}
            {finalDifficulty !== null && (
              <>
                {" = "}
                <b>{finalDifficulty}</b>
              </>
            )}
          </>
        )}
      </div>
      {outcome === null ? (
        <div data-testid="test-difficulty-awaited">
          <Translate>Set a Difficulty to see how it went</Translate>
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
      {canEdit && (
        <button
          type="button"
          data-testid="test-difficulty-reveal"
          onClick={() => {
            void setAbilityTestRevealed(msg, !difficulty.revealed);
          }}
        >
          {difficulty.revealed ? (
            <>
              <i className="fas fa-eye-slash" />{" "}
              <Translate>Hide from players</Translate>
            </>
          ) : (
            <>
              <i className="fas fa-eye" />{" "}
              <Translate>Reveal to players</Translate>
            </>
          )}
        </button>
      )}
    </div>
  );
};
