import { getTranslated } from "../../../functions/getTranslated";
import { assertGame } from "../../../functions/isGame";
import { useIsEditable } from "../../../hooks/useIsEditable";
import type { MwInjuryStatus } from "../../../types";
import { select } from "../../../styled-system/recipes";
import { css, cx } from "../../../styled-system/css";

interface MwInjuryStatusWidgetProps {
  status: MwInjuryStatus;
  setStatus: (status: MwInjuryStatus) => Promise<void>;
}

export const MwInjuryStatusWidget = ({
  status,
  setStatus,
}: MwInjuryStatusWidgetProps) => {
  assertGame(game);

  const isEditable = useIsEditable();

  const color =
    status === "uninjured"
      ? "#0f07"
      : status === "hurt"
        ? "#770f"
        : status === "down" || status === "unconscious"
          ? "#950f"
          : // dead
            "#f00f";

  return (
    <div
      className={css({
        padding: "0.5em 0 1em 0",
      })}
      style={{
        backgroundImage: `radial-gradient(closest-side, ${color}, #0000)`,
      }}
    >
      <div
        className={css({
          fontSize: "0.8em",
        })}
      >
        Injury Status
      </div>
      <select
        className={cx(
          select(),
          css({
            width: "100%",
          }),
        )}
        // uncontrolled, so a new choice shows straight away; the key resets
        // it when the saved status changes
        key={status}
        defaultValue={status}
        disabled={!isEditable}
        onChange={(e) => {
          void setStatus(e.currentTarget.value as MwInjuryStatus);
        }}
      >
        <option value={"uninjured"}>{getTranslated("Uninjured")}</option>
        <option value={"hurt"}>{getTranslated("Hurt")}</option>
        <option value={"down"}>{getTranslated("Down")}</option>
        <option value={"unconscious"}>{getTranslated("Unconscious")}</option>
        <option value={"dead"}>{getTranslated("Dead")}</option>
      </select>
    </div>
  );
};
