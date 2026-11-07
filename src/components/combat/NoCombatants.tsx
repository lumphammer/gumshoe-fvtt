import { memo } from "react";
import { PiEmptyLight } from "react-icons/pi";

import { localize } from "./functions";
import { css } from "../../styled-system/css";

export const NoCombatants = memo(function NoCombatants() {
  return (
    <div
      className={css({
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%",
        flexDirection: "column",
        textAlign: "center",
        color: "var(--color-text-secondary)",
      })}
    >
      <PiEmptyLight size={100} />
      <p className={css({ fontSize: "1.4em", fontWeight: "300" })}>
        {localize("investigator.NoParticipants")}
      </p>
    </div>
  );
});
