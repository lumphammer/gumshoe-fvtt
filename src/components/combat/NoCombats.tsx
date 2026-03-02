import { memo } from "react";
import { PiPeaceLight } from "react-icons/pi";

import { assertGame } from "../../functions/isGame";
import { localize } from "./functions";

export const NoCombats = memo(function NoCombats() {
  assertGame(game);
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
      <PiPeaceLight size={100} />
      <p css={{ fontSize: "1.4em", fontWeight: "300" }}>
        {localize("investigator.NoCombat")}
      </p>
      {game.user.isGM && (
        <button
          type="button"
          css={{
            justifySelf: "stretch",
            width: "auto",
          }}
          data-action="createCombat"
        >
          <i className="fa-solid fa-plus" inert />
          <span>{localize("COMBAT.Create")}</span>
        </button>
      )}
    </div>
  );
});
