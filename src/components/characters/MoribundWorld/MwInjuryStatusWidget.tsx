import { useEffect, useState } from "react";

import { getTranslated } from "../../../functions/getTranslated";
import { assertGame } from "../../../functions/utilities";
import { MwInjuryStatus } from "../../../types";

interface MwInjuryStatusWidgetProps {
  status: MwInjuryStatus;
  setStatus: (status: MwInjuryStatus) => Promise<void>;
}

export const MwInjuryStatusWidget = ({
  status,
  setStatus,
}: MwInjuryStatusWidgetProps) => {
  assertGame(game);

  const [display, setDisplay] = useState(status);

  useEffect(() => {
    void setStatus(display);
  }, [display, setStatus]);

  const color =
    display === "uninjured"
      ? "#0f07"
      : display === "hurt"
        ? "#770f"
        : display === "down" || display === "unconscious"
          ? "#950f"
          : // dead
            "#f00f";

  return (
    <div
      css={{
        padding: "0.5em 0 1em 0",
        backgroundImage: `radial-gradient(closest-side, ${color}, #0000)`,
      }}
    >
      <div
        css={{
          fontSize: "0.8em",
        }}
      >
        Injury Status
      </div>
      <select
        css={{
          width: "100%",
        }}
        value={display}
        onChange={(e) => {
          setDisplay(e.currentTarget.value as MwInjuryStatus);
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
