import { memo } from "react";
import { PiEmptyLight } from "react-icons/pi";

import { localize } from "./functions";

export const NoCombatants = memo(function NoCombatants() {
  return (
    <div
      css={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%",
        flexDirection: "column",
        textAlign: "center",
        color: "var(--color-text-secondary)",
      }}
    >
      <PiEmptyLight size={100} />
      <p css={{ fontSize: "1.4em", fontWeight: "300" }}>
        {localize("investigator.NoParticipants")}
      </p>
    </div>
  );
});
